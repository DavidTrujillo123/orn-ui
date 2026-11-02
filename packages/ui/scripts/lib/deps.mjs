// Resolves, for a component, what it needs to work in isolation:
// - `core: true` always (theme/ + icons/ — every component uses them,
//   directly or transitively, see theme/UIProvider.tsx).
// - `registryDependencies`: other registry components it depends on
//   (e.g. Wizard -> Steps, Button).
import fs from 'node:fs';
import path from 'node:path';

const IMPORT_RE = /from\s+'(\.\.?\/[^']+)'/g;

function resolveSpecifier(fromFile, specifier, srcDir) {
  const fromDir = path.dirname(path.join(srcDir, fromFile));
  const target = path.resolve(fromDir, specifier);
  const candidates = [target, `${target}.tsx`, `${target}.ts`, path.join(target, 'index.ts')];
  const hit = candidates.find((c) => fs.existsSync(c) && fs.statSync(c).isFile());
  if (!hit) return null;
  return path.relative(srcDir, hit).split(path.sep).join('/');
}

/**
 * `components`: output of discoverComponents(). `fileMap`: fileToComponent(components).
 * Returns { registryDependencies: string[] (slugs, no duplicates), core: true }.
 */
export function resolveDeps(component, components, fileMap, srcDir) {
  const registryDeps = new Set();
  const visitedFiles = new Set();
  const internalFiles = new Set([component.file]);

  function visit(relFile) {
    if (visitedFiles.has(relFile)) return;
    visitedFiles.add(relFile);

    const absFile = path.join(srcDir, relFile);
    if (!fs.existsSync(absFile)) return;
    const source = fs.readFileSync(absFile, 'utf8');

    for (const match of source.matchAll(IMPORT_RE)) {
      const resolved = resolveSpecifier(relFile, match[1], srcDir);
      if (!resolved) continue;

      if (resolved.startsWith('theme/') || resolved.startsWith('icons/')) {
        // Part of core, not of an individual component: don't walk any further
        // into theme/icons, it already comes complete with the `core` package.
        continue;
      }

      const owner = fileMap.get(resolved);
      if (!owner) {
        // Internal helper file not registered as a component of its own (e.g. organisms/imperativeBridge.ts)
        internalFiles.add(resolved);
        visit(resolved);
        continue;
      }
      if (owner.slug !== component.slug) registryDeps.add(owner.slug);
      visit(owner.file);
    }
  }

  visit(component.file);
  return { registryDependencies: [...registryDeps], internalFiles: [...internalFiles], core: true };
}
