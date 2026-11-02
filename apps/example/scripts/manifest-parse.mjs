// Reads the demo manifests as plain text, shared by both flow generators
// (smoke and docs clips).
//
// It doesn't import manifest.ts: it's TS, and the generators run with bare
// node from a package.json script. The manifests are arrays of flat literal
// objects, so tracking brace depth is enough to split entries, without
// dragging a TS parser into a `prepare`/CI step.
import fs from 'node:fs';
import path from 'node:path';

export const SOURCES = [
  { file: 'demos/manifest.ts', exportName: 'ATOMS', basePath: 'atoms' },
  { file: 'demos/manifest.ts', exportName: 'MOLECULES', basePath: 'molecules' },
  { file: 'demos/manifest.ts', exportName: 'ORGANISMS', basePath: 'organisms' },
  { file: 'demos/examples/manifest.ts', exportName: 'EXAMPLES', basePath: 'examples' },
];

/** Extracts the text between `export const NAME: DemoEntry[] = [` and its closing `]`. */
export function extractArrayLiteral(source, exportName) {
  const marker = `export const ${exportName}`;
  const start = source.indexOf(marker);
  if (start === -1) throw new Error(`"${marker}" not found`);
  // Looks for the literal's "= [", not the "[]" of the `DemoEntry[]`
  // annotation that appears earlier on the same line.
  const assign = source.indexOf('= [', start);
  if (assign === -1) throw new Error(`"= [" not found for "${marker}"`);
  const open = assign + 2;
  let depth = 0;
  for (let i = open; i < source.length; i++) {
    if (source[i] === '[') depth++;
    else if (source[i] === ']') {
      depth--;
      if (depth === 0) return source.slice(open + 1, i);
    }
  }
  throw new Error(`Array "${exportName}" is not closed`);
}

/** Splits the array's content into top-level `{ ... }` objects, tracking depth. */
export function splitObjects(arrayBody) {
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

export function field(objectText, key) {
  const match = objectText.match(new RegExp(`${key}:\\s*'([^']*)'`));
  return match?.[1];
}

export function boolField(objectText, key) {
  return new RegExp(`${key}:\\s*true\\b`).test(objectText);
}

export function parseManifest(root, { file, exportName, basePath }) {
  const source = fs.readFileSync(path.join(root, file), 'utf8');
  const arrayBody = extractArrayLiteral(source, exportName);
  return splitObjects(arrayBody).map((obj) => {
    const slug = field(obj, 'slug');
    const name = field(obj, 'name');
    if (!slug || !name) throw new Error(`Entry without slug/name in ${exportName}: ${obj.slice(0, 80)}`);
    const hostsList = boolField(obj, 'hostsList');
    const freeScroll = boolField(obj, 'freeScroll');
    // VariantList only pages when the demo doesn't host its own list/free
    // scroll — the same criterion ComponentDetailScreen uses to decide the
    // container (see manifest.ts, the comment on DemoEntry.freeScroll).
    const paged = !hostsList && !freeScroll;
    // The component's identifier (`Demo: ButtonDemo`), to resolve which file
    // its variants come from.
    const demoIdent = obj.match(/Demo:\s*([A-Za-z0-9_]+)/)?.[1];
    return { slug, name, basePath, paged, hostsList, freeScroll, demoIdent, source: file };
  });
}

export function parseAllManifests(root) {
  return SOURCES.flatMap((s) => parseManifest(root, s));
}

/**
 * Counts the variants the demo passes to VariantList, by reading the
 * component's `.tsx`. It's what decides how many times the clip has to page:
 * the manifest doesn't know it, the list lives in the demo itself.
 *
 * Returns `null` when the demo doesn't build a `VariantDef[]` (the examples
 * are full screens, not catalogs).
 */
export function variantLabels(root, entry) {
  const importSource = entry.source === 'demos/examples/manifest.ts' ? 'demos/examples/manifest.ts' : 'demos/manifest.ts';
  const manifestSource = fs.readFileSync(path.join(root, importSource), 'utf8');
  if (!entry.demoIdent) return null;
  const importLine = manifestSource.match(new RegExp(`import\\s*\\{[^}]*\\b${entry.demoIdent}\\b[^}]*\\}\\s*from\\s*'([^']+)'`));
  if (!importLine) return null;
  const relative = importLine[1].replace(/^\.\//, '');
  const dir = path.dirname(path.join(root, importSource));
  const demoFile = path.join(dir, `${relative}.tsx`);
  if (!fs.existsSync(demoFile)) return null;
  const demoSource = fs.readFileSync(demoFile, 'utf8');
  if (!/VariantDef\[\]\s*=\s*\[/.test(demoSource)) return null;
  const start = demoSource.indexOf('VariantDef[] = [');
  const open = demoSource.indexOf('[', start + 'VariantDef[]'.length);
  let depth = 0;
  let body = null;
  for (let i = open; i < demoSource.length; i++) {
    if (demoSource[i] === '[') depth++;
    else if (demoSource[i] === ']') {
      depth--;
      if (depth === 0) { body = demoSource.slice(open + 1, i); break; }
    }
  }
  if (body === null) return null;
  return splitObjects(body)
    .map((obj) => obj.match(/label:\s*'([^']*)'/)?.[1] ?? obj.match(/label:\s*"([^"]*)"/)?.[1])
    .filter(Boolean);
}
