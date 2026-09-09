#!/usr/bin/env node
// Genera un flow de humo de Maestro por cada demo del manifest (uno por
// componente en Atoms/Molecules/Organisms/Examples). Sin generarlos, agregar
// un componente nuevo no suma cobertura sola — el mismo motivo por el que
// gen-exports.mjs deriva el "exports" map del package.json de src/ en vez de
// mantenerlo a mano.
//
// El parseo de los manifests vive en scripts/manifest-parse.mjs, compartido
// con gen-maestro-demos.mjs (los clips de la doc): son los mismos manifests
// leídos como texto, y tener dos parsers era garantía de que se desincronicen.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseAllManifests } from './manifest-parse.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const FLOWS_DIR = path.join(ROOT, '.maestro/flows/smoke');
const APP_ID = 'com.anonymous.orn-ui-example';

// Únicos flows de flows/smoke/ escritos a mano (no derivan de una entrada del
// manifest) — se excluyen de la limpieza de "sobrantes" para que gen:maestro
// no los borre. Ver README: nav-tabs-and-list.yaml es el único que navega
// tabs/lista/back en vez de entrar por deep link.
const HAND_WRITTEN = new Set(['nav-tabs-and-list.yaml']);

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
  const entries = parseAllManifests(ROOT);

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
