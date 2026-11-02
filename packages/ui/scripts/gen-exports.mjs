#!/usr/bin/env node
// Generates the package.json "exports" map: one subpath per component
// (orn-ui/button) plus ./theme and ./icons, so Metro/webpack can bundle
// only what is imported instead of the full barrel (orn-ui/.).
// It doesn't replace "." or "./package.json" — the full install
// (`import { Button } from 'orn-ui'`) keeps working just as always.
//
// Runs in `prepare` (before `bob build`) and in CI, where `--check` fails
// if the committed package.json is out of date with respect to src/.
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

  // One subpath per component slug (includes siblings from the same file
  // under their own name: Title/Subtitle/Body/Caption all point to
  // Text.tsx, each with its own subpath for import readability).
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
  // Deprecated: SafeAreaUIProvider is now an alias of UIProvider, which
  // measures the insets itself. The subpath is kept so existing imports don't break.
  exportsMap['./safe-area'] = subpathEntry('safe-area/index.ts', 'safe-area/index');
  exportsMap['./package.json'] = './package.json';

  return exportsMap;
}

/** Replaces only the "exports": {...} block in package.json's raw text,
 * preserving the rest of the file byte for byte (key order, formatting). */
function spliceExports(source, newExportsValue) {
  const keyMatch = /"exports"\s*:\s*/.exec(source);
  if (!keyMatch) throw new Error('package.json has no existing "exports" field.');
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
    .join('\n  '); // indent two extra spaces: it lives inside the root object

  return source.slice(0, braceStart) + newBlock + source.slice(braceEnd + 1);
}

function main() {
  const check = process.argv.includes('--check');
  const original = fs.readFileSync(PKG_PATH, 'utf8');
  const generated = spliceExports(original, buildExports());

  if (check) {
    if (generated !== original) {
      console.error(
        '[gen-exports] package.json "exports" is out of date with respect to src/. Run `pnpm --filter orn-ui gen:exports`.'
      );
      process.exit(1);
    }
    console.log('[gen-exports] exports map up to date.');
    return;
  }

  fs.writeFileSync(PKG_PATH, generated);
  console.log('[gen-exports] package.json "exports" updated.');
}

main();
