// Resuelve, para un componente, qué necesita para funcionar aislado:
// - `core: true` siempre (theme/ + icons/ — todo componente los usa,
//   directa o transitivamente, ver theme/UIProvider.tsx).
// - `registryDependencies`: otros componentes del registry de los que
//   depende (p.ej. Wizard -> Steps, Button).
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
 * `components`: salida de discoverComponents(). `fileMap`: fileToComponent(components).
 * Devuelve { registryDependencies: string[] (slugs, sin duplicados), core: true }.
 */
export function resolveDeps(component, components, fileMap, srcDir) {
  const registryDeps = new Set();
  const visitedFiles = new Set();

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
        // Parte de core, no de un componente individual: no recorrer más
        // adentro de theme/icons, ya viene completo con el paquete `core`.
        continue;
      }

      const owner = fileMap.get(resolved);
      if (!owner) continue; // archivo de otra categoría no registrado (no debería pasar)
      if (owner.slug !== component.slug) registryDeps.add(owner.slug);
      visit(owner.file);
    }
  }

  visit(component.file);
  return { registryDependencies: [...registryDeps], core: true };
}
