// Lectura de los manifests de demos como texto plano, compartida por los dos
// generadores de flows (humo y clips de doc).
//
// No importa manifest.ts: es TS, y los generadores corren con node pelado
// desde un script de package.json. Los manifests son arrays de objetos
// literales chatos, así que alcanza con trackear profundidad de llaves para
// separar entradas, sin arrastrar un parser de TS a un `prepare`/CI step.
import fs from 'node:fs';
import path from 'node:path';

export const SOURCES = [
  { file: 'demos/manifest.ts', exportName: 'ATOMS', basePath: 'atoms' },
  { file: 'demos/manifest.ts', exportName: 'MOLECULES', basePath: 'molecules' },
  { file: 'demos/manifest.ts', exportName: 'ORGANISMS', basePath: 'organisms' },
  { file: 'demos/examples/manifest.ts', exportName: 'EXAMPLES', basePath: 'examples' },
];

/** Extrae el texto entre `export const NAME: DemoEntry[] = [` y su `]` de cierre. */
export function extractArrayLiteral(source, exportName) {
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
    if (!slug || !name) throw new Error(`Entrada sin slug/name en ${exportName}: ${obj.slice(0, 80)}`);
    const hostsList = boolField(obj, 'hostsList');
    const freeScroll = boolField(obj, 'freeScroll');
    // VariantList pagina sólo cuando el demo no hostea su propia lista/scroll
    // libre — mismo criterio que ComponentDetailScreen usa para decidir el
    // contenedor (ver manifest.ts, comentario de DemoEntry.freeScroll).
    const paged = !hostsList && !freeScroll;
    // El identificador del componente (`Demo: ButtonDemo`), para resolver de
    // qué archivo salen sus variantes.
    const demoIdent = obj.match(/Demo:\s*([A-Za-z0-9_]+)/)?.[1];
    return { slug, name, basePath, paged, hostsList, freeScroll, demoIdent, source: file };
  });
}

export function parseAllManifests(root) {
  return SOURCES.flatMap((s) => parseManifest(root, s));
}

/**
 * Cuenta las variantes que el demo le pasa a VariantList, leyendo el `.tsx`
 * del componente. Es lo que decide cuántas veces el clip tiene que paginar:
 * el manifest no lo sabe, la lista vive en el propio demo.
 *
 * Devuelve `null` cuando el demo no arma un `VariantDef[]` (los ejemplos son
 * pantallas completas, no catálogos).
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
