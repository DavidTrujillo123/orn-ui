#!/usr/bin/env node
// Genera un flow de humo de Maestro por cada demo del manifest (uno por
// componente en Atoms/Molecules/Organisms/Examples). Sin generarlos, agregar
// un componente nuevo no suma cobertura sola — el mismo motivo por el que
// gen-exports.mjs deriva el "exports" map del package.json de src/ en vez de
// mantenerlo a mano.
//
// No importa manifest.ts (es TS, y este script corre con node plano): lo
// parsea como texto. Los manifests son arrays de objetos literales chatos —
// alcanza con trackear profundidad de llaves para separar entradas, sin
// arrastrar un parser de TS a un `prepare`/CI step.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const FLOWS_DIR = path.join(ROOT, '.maestro/flows/smoke');
const APP_ID = 'com.anonymous.orn-ui-example';

// Únicos flows de flows/smoke/ escritos a mano (no derivan de una entrada del
// manifest) — se excluyen de la limpieza de "sobrantes" para que gen:maestro
// no los borre. Ver README: nav-tabs-and-list.yaml es el único que navega
// tabs/lista/back en vez de entrar por deep link.
const HAND_WRITTEN = new Set(['nav-tabs-and-list.yaml']);

const SOURCES = [
  { file: 'demos/manifest.ts', exportName: 'ATOMS', basePath: 'atoms' },
  { file: 'demos/manifest.ts', exportName: 'MOLECULES', basePath: 'molecules' },
  { file: 'demos/manifest.ts', exportName: 'ORGANISMS', basePath: 'organisms' },
  { file: 'demos/examples/manifest.ts', exportName: 'EXAMPLES', basePath: 'examples' },
];

/** Extrae el texto entre `export const NAME: DemoEntry[] = [` y su `]` de cierre. */
function extractArrayLiteral(source, exportName) {
  const marker = `export const ${exportName}`;
  const start = source.indexOf(marker);
  if (start === -1) throw new Error(`No se encontró "${marker}"`);
  // Busca el "= [" del literal, no el "[]" de la anotación `DemoEntry[]` que
  // aparece antes en la misma línea.
  const assign = source.indexOf('= [', start);
  if (assign === -1) throw new Error(`No se encontró "= [" para "${marker}"`);
  const open = assign + 2;
  let depth = 0;
  for (let i = open; i < source.length; i++) {
    if (source[i] === '[') depth++;
    else if (source[i] === ']') {
      depth--;
      if (depth === 0) return source.slice(open + 1, i);
    }
  }
  throw new Error(`Array "${exportName}" sin cerrar`);
}

/** Divide el contenido del array en los objetos top-level `{ ... }`, trackeando profundidad. */
function splitObjects(arrayBody) {
  const objects = [];
  let depth = 0;
  let objStart = -1;
  for (let i = 0; i < arrayBody.length; i++) {
    const ch = arrayBody[i];
    if (ch === '{') {
      if (depth === 0) objStart = i;
      depth++;
    } else if (ch === '}') {
      depth--;
      if (depth === 0) objects.push(arrayBody.slice(objStart, i + 1));
    }
  }
  return objects;
}

function field(objectText, key) {
  const match = objectText.match(new RegExp(`${key}:\\s*'([^']*)'`));
  return match?.[1];
}

function boolField(objectText, key) {
  return new RegExp(`${key}:\\s*true\\b`).test(objectText);
}

function parseManifest({ file, exportName, basePath }) {
  const source = fs.readFileSync(path.join(ROOT, file), 'utf8');
  const arrayBody = extractArrayLiteral(source, exportName);
  return splitObjects(arrayBody).map((obj) => {
    const slug = field(obj, 'slug');
    const name = field(obj, 'name');
    if (!slug || !name) throw new Error(`Entrada sin slug/name en ${exportName}: ${obj.slice(0, 80)}`);
    const hostsList = boolField(obj, 'hostsList');
    const freeScroll = boolField(obj, 'freeScroll');
    // VariantList pagina sólo cuando el demo no hostea su propia lista/scroll
    // libre — mismo criterio que ComponentDetailScreen usa para decidir el
    // contenedor (ver manifest.ts, comentario de DemoEntry.freeScroll).
    const paged = !hostsList && !freeScroll;
    return { slug, name, basePath, paged };
  });
}

function yamlEscape(text) {
  return text.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function flowFor(entry) {
  return `# Generado por scripts/gen-maestro-flows.mjs — no editar a mano.
# Fuente: ${entry.basePath === 'examples' ? 'demos/examples/manifest.ts' : 'demos/manifest.ts'} (slug: ${entry.slug})
appId: ${APP_ID}
tags:
  - smoke
---
- runFlow:
    file: ../../subflows/smoke-demo.yaml
    env:
      MAESTRO_APP_ID: ${APP_ID}
      BASE_PATH: "${entry.basePath}"
      SLUG: "${entry.slug}"
      TITLE: "${yamlEscape(entry.name)}"
      PAGED: "${entry.paged}"
`;
}

function main() {
  const checkOnly = process.argv.includes('--check');
  const entries = SOURCES.flatMap(parseManifest);

  const seen = new Set();
  for (const entry of entries) {
    const key = `${entry.basePath}/${entry.slug}`;
    if (seen.has(key)) throw new Error(`Slug duplicado: ${key}`);
    seen.add(key);
  }

  fs.mkdirSync(FLOWS_DIR, { recursive: true });
  const wanted = new Map(entries.map((e) => [`${e.basePath}-${e.slug}.yaml`, flowFor(e)]));

  const existing = fs.existsSync(FLOWS_DIR) ? fs.readdirSync(FLOWS_DIR) : [];
  const stale = existing.filter((f) => f.endsWith('.yaml') && !wanted.has(f) && !HAND_WRITTEN.has(f));

  let changed = false;
  for (const [filename, content] of wanted) {
    const filePath = path.join(FLOWS_DIR, filename);
    const current = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : null;
    if (current !== content) {
      changed = true;
      if (checkOnly) {
        console.error(`✗ desactualizado: .maestro/flows/smoke/${filename}`);
      } else {
        fs.writeFileSync(filePath, content);
      }
    }
  }
  for (const filename of stale) {
    changed = true;
    if (checkOnly) {
      console.error(`✗ sobrante: .maestro/flows/smoke/${filename}`);
    } else {
      fs.unlinkSync(path.join(FLOWS_DIR, filename));
    }
  }

  if (checkOnly) {
    if (changed) {
      console.error(`\nLos flows de humo de Maestro no están al día. Corré: pnpm --filter example gen:maestro`);
      process.exit(1);
    }
    console.log(`✓ ${entries.length} flows de humo al día`);
    return;
  }

  console.log(`✓ Generados ${entries.length} flows de humo en .maestro/flows/smoke/`);
}

main();
