// Single source of truth: which component lives in which file. It's derived
// from the real barrels (src/{atoms,molecules,organisms}/index.ts) instead of
// keeping a separate list — that way gen-exports.mjs, build-registry.mjs (and,
// on the orn-ui-docs side, extract-docs.mjs via registry/manifest.json)
// never drift from the real source code.
import fs from 'node:fs';
import path from 'node:path';

export const CATEGORIES = ['atoms', 'molecules', 'organisms'];

/**
 * PascalCase/camelCase -> kebab-case (same as orn-ui-docs' slugger),
 * plus SCREAMING_SNAKE_CASE -> kebab-case (e.g. DEFAULT_MONTH_NAMES, a
 * const exported alongside DatePicker) so no subpath/slug ends up with an
 * underscore instead of a hyphen.
 */
export function kebab(name) {
  return name
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/_/g, '-')
    .toLowerCase();
}

// Joins exports from the same file across several lines (e.g. `export {
// AlertProvider } ...` and then an `export type { AlertOptions }` don't count,
// only `export { ... } from` of VALUES, never `export type`.
const EXPORT_RE = /^export\s*\{([^}]+)\}\s*from\s*'\.\/(\w+)';/gm;

/**
 * Walks src/'s barrels and returns one component per exported name, grouped
 * by the file that backs it. Several names from the same file (Text.tsx ->
 * Title/Subtitle/Body/Caption, AlertProvider.tsx -> AlertProvider/useAlert,
 * DatePicker.tsx -> DatePicker/buildMonthGrid/...) share `file` and
 * `siblingNames`; the registry treats them as a unit.
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
      // The first exported name is the "main" one (the component itself);
      // the others (hooks, helpers) are part of the same file package.
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

/** file (relative to src/, e.g. "atoms/Button.tsx") -> the component it backs. */
export function fileToComponent(components) {
  const map = new Map();
  for (const c of components) map.set(c.file, c);
  return map;
}
