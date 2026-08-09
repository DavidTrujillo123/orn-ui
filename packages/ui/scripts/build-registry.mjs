#!/usr/bin/env node
// Genera registry/*.json: catálogo instalable componente-por-componente,
// consumido por el CLI (bin/orn-ui.mjs) y por orn-ui-docs (que lo copia a
// public/r/ para servirlo como endpoint estático).
//
// registry/core.json      -> theme/ + icons/ completos (todo componente los necesita)
// registry/<slug>.json    -> archivo(s) propios del componente + sus deps
// registry/index.json     -> catálogo liviano (sin contenido) para listar/buscar
// registry/manifest.json  -> { components: [...] } crudo de discoverComponents(),
//                             lo reusa orn-ui-docs/scripts/extract-docs.mjs para no
//                             mantener una segunda lista de componentes a mano.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { discoverComponents, fileToComponent } from './lib/components.mjs';
import { resolveDeps } from './lib/deps.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'src');
const OUT_DIR = path.join(ROOT, 'registry');

const CORE_DIRS = ['theme', 'icons'];

function readFilesUnder(dir, srcDir) {
  const out = [];
  const absDir = path.join(srcDir, dir);
  for (const entry of fs.readdirSync(absDir, { withFileTypes: true })) {
    if (entry.name === '__tests__' || entry.name.endsWith('.test.ts') || entry.name.endsWith('.test.tsx')) continue;
    const rel = `${dir}/${entry.name}`;
    if (entry.isDirectory()) {
      out.push(...readFilesUnder(rel, srcDir));
    } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) {
      out.push(rel);
    }
  }
  return out;
}

function fileEntry(relPath, srcDir) {
  return { path: relPath, content: fs.readFileSync(path.join(srcDir, relPath), 'utf8') };
}

function buildCore() {
  const files = CORE_DIRS.flatMap((dir) => readFilesUnder(dir, SRC)).sort();
  return {
    name: 'core',
    type: 'core',
    description: 'theme (UIProvider, tokens, palettes) + icons — requerido por todos los componentes.',
    files: files.map((f) => fileEntry(f, SRC)),
    registryDependencies: [],
    peerDependencies: { react: '>=18.0.0', 'react-native': '>=0.73.0' },
  };
}

function buildComponentEntry(component, components, fileMap) {
  const { registryDependencies, internalFiles } = resolveDeps(component, components, fileMap, SRC);
  return {
    name: component.name,
    slug: component.slug,
    type: 'component',
    category: component.category,
    exportedNames: [component.name, ...component.siblingNames],
    files: internalFiles.map((f) => fileEntry(f, SRC)),
    // "core" siempre primero: el CLI lo instala antes de escribir el resto.
    registryDependencies: ['core', ...registryDependencies],
  };
}

function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const components = discoverComponents(SRC);
  const fileMap = fileToComponent(components);

  const core = buildCore();
  fs.writeFileSync(path.join(OUT_DIR, 'core.json'), JSON.stringify(core, null, 2));

  const index = [];
  for (const component of components) {
    const entry = buildComponentEntry(component, components, fileMap);
    fs.writeFileSync(path.join(OUT_DIR, `${component.slug}.json`), JSON.stringify(entry, null, 2));
    index.push({
      name: entry.name,
      slug: entry.slug,
      category: entry.category,
      exportedNames: entry.exportedNames,
      registryDependencies: entry.registryDependencies,
      bytes: entry.files.reduce((sum, f) => sum + Buffer.byteLength(f.content), 0),
    });
  }
  fs.writeFileSync(
    path.join(OUT_DIR, 'index.json'),
    JSON.stringify({ core: { bytes: core.files.reduce((s, f) => s + Buffer.byteLength(f.content), 0) }, components: index }, null, 2)
  );
  fs.writeFileSync(path.join(OUT_DIR, 'manifest.json'), JSON.stringify({ components }, null, 2));

  console.log(`[build-registry] ${components.length} componentes + core -> ${path.relative(ROOT, OUT_DIR)}/`);
}

main();
