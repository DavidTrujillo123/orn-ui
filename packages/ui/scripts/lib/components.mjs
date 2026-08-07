// Fuente única de verdad: qué componente vive en qué archivo. Se deriva de
// los barrels reales (src/{atoms,molecules,organisms}/index.ts) en vez de
// mantener una lista aparte — así gen-exports.mjs, build-registry.mjs (y,
// del lado de orn-ui-docs, extract-docs.mjs vía registry/manifest.json)
// nunca se desincronizan del código fuente real.
import fs from 'node:fs';
import path from 'node:path';

export const CATEGORIES = ['atoms', 'molecules', 'organisms'];

/**
 * PascalCase/camelCase -> kebab-case (igual que el slugger de orn-ui-docs),
 * más SCREAMING_SNAKE_CASE -> kebab-case (p.ej. DEFAULT_MONTH_NAMES, un
 * const exportado junto a DatePicker) para que ningún subpath/slug quede
 * con guión bajo en vez de guión medio.
 */
export function kebab(name) {
  return name
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/_/g, '-')
    .toLowerCase();
}

// Une exports desde el mismo archivo en varias líneas (p.ej. `export {
// AlertProvider } ...` y luego un `export type { AlertOptions }` no cuentan,
// solo los `export { ... } from` de VALORES, nunca `export type`.
const EXPORT_RE = /^export\s*\{([^}]+)\}\s*from\s*'\.\/(\w+)';/gm;

/**
 * Recorre los barrels de src/ y devuelve un componente por cada nombre
 * exportado, agrupado por el archivo que lo respalda. Varios nombres del
 * mismo archivo (Text.tsx -> Title/Subtitle/Body/Caption, AlertProvider.tsx
 * -> AlertProvider/useAlert, DatePicker.tsx -> DatePicker/buildMonthGrid/...)
 * comparten `file` y `siblingNames`; el registry los trata como una unidad.
 */
export function discoverComponents(srcDir) {
  const components = [];
  for (const category of CATEGORIES) {
    const barrelPath = path.join(srcDir, category, 'index.ts');
    if (!fs.existsSync(barrelPath)) continue;
    const barrel = fs.readFileSync(barrelPath, 'utf8');

    for (const match of barrel.matchAll(EXPORT_RE)) {
      const names = match[1]
        .split(',')
        .map((n) => n.trim())
        .filter(Boolean);
      const fileBase = match[2];
      const file = `${category}/${fileBase}.tsx`;
      // El primer nombre exportado es el "principal" (el componente en sí);
      // los demás (hooks, helpers) son parte del mismo paquete de archivo.
      const [primary, ...rest] = names;
      components.push({
        name: primary,
        siblingNames: rest,
        category,
        file,
        slug: kebab(primary),
      });
    }
  }
  return components;
}

/** file (relativo a src/, p.ej. "atoms/Button.tsx") -> componente que lo respalda. */
export function fileToComponent(components) {
  const map = new Map();
  for (const c of components) map.set(c.file, c);
  return map;
}
