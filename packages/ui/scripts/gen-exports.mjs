#!/usr/bin/env node
// Genera el mapa "exports" de package.json: un subpath por componente
// (orn-ui/button) más ./theme y ./icons, para que Metro/webpack puedan
// empaquetar solo lo importado en vez del barrel completo (orn-ui/.).
// No reemplaza "." ni "./package.json" — la instalación completa
// (`import { Button } from 'orn-ui'`) sigue funcionando igual que siempre.
//
// Corre en `prepare` (antes de `bob build`) y en CI, donde `--check` falla
// si el package.json committeado quedó desactualizado respecto a src/.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { discoverComponents, kebab } from './lib/components.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'src');
const PKG_PATH = path.join(ROOT, 'package.json');

function subpathEntry(sourceRelPath, outputRelPathNoExt) {
  return {
    types: `./lib/typescript/${outputRelPathNoExt}.d.ts`,
    'react-native': `./src/${sourceRelPath}`,
    default: `./lib/module/${outputRelPathNoExt}.js`,
  };
}

function buildExports() {
  const components = discoverComponents(SRC);
  const exportsMap = {
    '.': {
      types: './lib/typescript/index.d.ts',
      'react-native': './src/index.ts',
      default: './lib/module/index.js',
    },
  };

  // Un subpath por slug de componente (incluye siblings del mismo archivo
  // bajo su propio nombre: Title/Subtitle/Body/Caption todas apuntan a
  // Text.tsx, cada una con su propio subpath por legibilidad del import).
  const seen = new Set();
  for (const c of components) {
    const withoutExt = c.file.replace(/\.tsx?$/, '');
    for (const name of [c.name, ...c.siblingNames]) {
      const slug = name === c.name ? c.slug : kebab(name);
      if (seen.has(slug)) continue;
      seen.add(slug);
      exportsMap[`./${slug}`] = subpathEntry(c.file, withoutExt);
    }
  }

  exportsMap['./theme'] = subpathEntry('theme/index.ts', 'theme/index');
  exportsMap['./icons'] = subpathEntry('icons/index.ts', 'icons/index');
  // Subpath propio y fuera del barrel principal a propósito: es el único
  // archivo que importa react-native-safe-area-context (peer opcional). Si
  // colgara de "." el bundler lo resolvería para todos y la librería dejaría
  // de tener cero dependencias de runtime.
  exportsMap['./safe-area'] = subpathEntry('safe-area/index.ts', 'safe-area/index');
  exportsMap['./package.json'] = './package.json';

  return exportsMap;
}

/** Reemplaza solo el bloque "exports": {...} del texto crudo del package.json,
 * preservando byte a byte el resto del archivo (orden de claves, formato). */
function spliceExports(source, newExportsValue) {
  const keyMatch = /"exports"\s*:\s*/.exec(source);
  if (!keyMatch) throw new Error('package.json no tiene un campo "exports" existente.');
  const braceStart = source.indexOf('{', keyMatch.index);

  let depth = 0;
  let i = braceStart;
  let inString = false;
  for (; i < source.length; i++) {
    const ch = source[i];
    if (inString) {
      if (ch === '\\') i++;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) break;
    }
  }
  const braceEnd = i;

  const newBlock = JSON.stringify(newExportsValue, null, 2)
    .split('\n')
    .join('\n  '); // indentar dos espacios extra: vive dentro del objeto raíz

  return source.slice(0, braceStart) + newBlock + source.slice(braceEnd + 1);
}

function main() {
  const check = process.argv.includes('--check');
  const original = fs.readFileSync(PKG_PATH, 'utf8');
  const generated = spliceExports(original, buildExports());

  if (check) {
    if (generated !== original) {
      console.error(
        '[gen-exports] package.json "exports" está desactualizado respecto a src/. Corre `pnpm --filter orn-ui gen:exports`.'
      );
      process.exit(1);
    }
    console.log('[gen-exports] exports map al día.');
    return;
  }

  fs.writeFileSync(PKG_PATH, generated);
  console.log('[gen-exports] package.json "exports" actualizado.');
}

main();
