#!/usr/bin/env node
// Harness del repo: verifica de una sola pasada las reglas que un cambio
// suelto rompe sin que nada falle — las que hay que releer en AGENTS.md
// justamente porque ningún compilador las mira.
//
// Uso:
//   node scripts/check-harness.mjs          # todo
//   node scripts/check-harness.mjs --rules deps,layers
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { discoverComponents } from '../packages/ui/scripts/lib/components.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const UI = path.join(ROOT, 'packages/ui');
const SRC = path.join(UI, 'src');
const EXAMPLE = path.join(ROOT, 'apps/example');

const read = (...p) => fs.readFileSync(path.join(...p), 'utf8');
const exists = (...p) => fs.existsSync(path.join(...p));

const failures = [];
const fail = (rule, message) => failures.push({ rule, message });

/** Archivos .ts/.tsx bajo `dir`, sin tests. */
function sourceFiles(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === '__tests__') continue;
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) sourceFiles(abs, out);
    else if (/\.tsx?$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name)) out.push(abs);
  }
  return out;
}

/** Quita comentarios de línea y de bloque: un `#fff` citado en un comentario no es un color hardcodeado. */
function stripComments(source) {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
}

// ── componentes ────────────────────────────────────────────────────────────
const components = discoverComponents(SRC);

/**
 * Componentes que no tienen demo/test/slug propios porque viven adentro de
 * otro (un provider y su componente, un field y su picker). No es un olvido:
 * el archivo que los cubre tiene que existir y nombrarlos, y eso es lo que se
 * verifica. Agregar acá una entrada es una decisión deliberada, no un modo de
 * saltear el checklist.
 */
const SHARED = {
  Title: { slug: 'typography' },
  AlertProvider: { demo: 'Alert', slug: 'alert' },
  ToastProvider: { demo: 'Toast', test: 'Toast', slug: 'toast' },
  DateField: { demo: 'DatePicker', test: 'DatePicker', slug: 'date-picker' },
};

/** ¿El archivo usa el componente, sea por su nombre o por alguno de los que exporta con él? */
function mentionsAny(source, { name, siblingNames }) {
  return [name, ...siblingNames].some((n) => new RegExp(`\\b${n}\\b`).test(source));
}

/** Tramo del manifest de demos que corresponde a una categoría (ATOMS/MOLECULES/ORGANISMS). */
function manifestSection(manifest, category) {
  const order = ['ATOMS', 'MOLECULES', 'ORGANISMS'];
  const index = order.indexOf(category.toUpperCase());
  const start = manifest.indexOf(`export const ${order[index]}`);
  if (start === -1) return '';
  const next = order[index + 1] ? manifest.indexOf(`export const ${order[index + 1]}`) : -1;
  return manifest.slice(start, next === -1 ? undefined : next);
}

/** Todo el código de la app de ejemplo concatenado, para preguntar "¿esto se usa en algún lado?". */
function readExampleSources() {
  const dirs = ['app', 'components', 'demos', 'services'];
  return dirs
    .filter((dir) => exists(EXAMPLE, dir))
    .flatMap((dir) => sourceFiles(path.join(EXAMPLE, dir)))
    .map((file) => read(file))
    .join('\n');
}

function checkComponents() {
  const manifest = read(EXAMPLE, 'demos/manifest.ts');
  const exampleSources = readExampleSources();
  const rootReadme = read(ROOT, 'README.md');
  const uiReadme = read(UI, 'README.md');
  const agents = read(UI, 'AGENTS.md');
  const llms = read(UI, 'llms.txt');

  for (const component of components) {
    const { name, category, file } = component;
    const shared = SHARED[name] ?? {};
    const base = path.basename(file, '.tsx');
    const testBase = shared.test ?? base;
    const demoBase = shared.demo ?? base;
    const slug = shared.slug ?? component.slug;

    const testFile = path.join(SRC, category, '__tests__', `${testBase}.test.tsx`);
    if (!exists(testFile)) {
      fail('test', `${name}: falta packages/ui/src/${category}/__tests__/${testBase}.test.tsx`);
    } else if (shared.test && !read(testFile).includes(name)) {
      fail('test', `${name}: ${testBase}.test.tsx debería cubrirlo y ni lo nombra`);
    }

    const demoFile = path.join(EXAMPLE, 'demos', `${demoBase}.demo.tsx`);
    if (!exists(demoFile)) {
      fail('demo', `${name}: falta apps/example/demos/${demoBase}.demo.tsx`);
    }

    // El demo pareado alcanza para la navegación, pero lo que prueba que el
    // componente está realmente ejercitado es que la app lo use en algún lado:
    // un provider aparece montado en el layout, un hook adentro de un ejemplo.
    if (!mentionsAny(exampleSources, component)) {
      fail('demo', `${name}: ningún archivo de apps/example lo usa (ni él ni los nombres que exporta)`);
    }

    const section = manifestSection(manifest, category);
    if (!section.includes(`slug: '${slug}'`)) {
      fail('demo', `${name}: sin entrada slug: '${slug}' en ${category.toUpperCase()} de demos/manifest.ts`);
    }

    if (!exists(EXAMPLE, '.maestro/flows/smoke', `${category}-${slug}.yaml`)) {
      fail('maestro', `${name}: falta .maestro/flows/smoke/${category}-${slug}.yaml (corré pnpm --filter example gen:maestro)`);
    }

    for (const [label, doc] of [
      ['README.md', rootReadme],
      ['packages/ui/README.md', uiReadme],
      ['packages/ui/AGENTS.md', agents],
      ['packages/ui/llms.txt', llms],
    ]) {
      const mentioned = label.endsWith('llms.txt') ? new RegExp(`\\b${name}\\b`).test(doc) : doc.includes(`\`${name}\``);
      if (!mentioned) fail('docs', `${name}: sin fila/mención en ${label}`);
    }
  }
}

// ── conteos ────────────────────────────────────────────────────────────────
// La tabla del README raíz es la fuente: un componente por fila, y las filas
// que agrupan varios nombres (`Title`/`Subtitle`/...) cuentan por cada nombre.
function documentedNames() {
  const rows = read(ROOT, 'README.md')
    .split('\n')
    .filter((line) => /^\| `[A-Z]/.test(line) && line.includes('orn-ui/'));
  const names = new Set();
  for (const row of rows) {
    const firstCell = row.split('|')[1] ?? '';
    for (const match of firstCell.matchAll(/`([A-Za-z]+)`/g)) names.add(match[1]);
  }
  return names;
}

function checkCounts() {
  const expected = documentedNames().size;
  const sources = [
    ['README.md', read(ROOT, 'README.md'), /(\d+) components across atoms/],
    ['packages/ui/README.md', read(UI, 'README.md'), /(\d+) components \(atoms/],
    ['packages/ui/llms.txt', read(UI, 'llms.txt'), /(\d+) typed components/],
    ['packages/ui/package.json', read(UI, 'package.json'), /(\d+) typed components/],
    ['packages/ui/AGENTS.md', read(UI, 'AGENTS.md'), /(\d+) components, fully typed/],
    ['packages/ui/AGENTS.md', read(UI, 'AGENTS.md'), /all (\d+) components/],
  ];
  for (const [label, doc, re] of sources) {
    const match = doc.match(re);
    if (!match) {
      fail('count', `${label}: no se encontró el conteo de componentes (${re})`);
    } else if (Number(match[1]) !== expected) {
      fail('count', `${label}: dice ${match[1]} componentes, la tabla del README lista ${expected}`);
    }
  }

  const missing = components.filter((c) => !documentedNames().has(c.name));
  for (const c of missing) fail('count', `${c.name}: exportado por el barrel pero sin fila en la tabla del README raíz`);
}

// ── cero dependencias ──────────────────────────────────────────────────────
const ALLOWED_IMPORTS = [/^react$/, /^react\//, /^react-native$/, /^react-native\//];
const SAFE_AREA_ONLY = /^react-native-safe-area-context$/;

function checkDeps() {
  for (const file of sourceFiles(SRC)) {
    const rel = path.relative(SRC, file);
    const source = stripComments(read(file));
    for (const match of source.matchAll(/from\s+'([^']+)'/g)) {
      const spec = match[1];
      if (spec.startsWith('.')) continue;
      if (ALLOWED_IMPORTS.some((re) => re.test(spec))) continue;
      // safe-area/ es la única excepción, y es un peer opcional declarado.
      if (SAFE_AREA_ONLY.test(spec) && rel.startsWith('safe-area/')) continue;
      fail('deps', `${rel}: importa '${spec}' — src/ sólo puede importar react y react-native`);
    }
  }
}

// ── atomic design ──────────────────────────────────────────────────────────
// Las capas van en un solo sentido: un átomo que importa un organismo deja de
// ser un átomo, y el registry (que resuelve dependencias por archivo) empieza
// a arrastrar medio catálogo por un componente.
const FORBIDDEN_LAYERS = {
  atoms: ['molecules', 'organisms'],
  molecules: ['organisms'],
  organisms: [],
};

function checkLayers() {
  for (const [layer, forbidden] of Object.entries(FORBIDDEN_LAYERS)) {
    for (const file of sourceFiles(path.join(SRC, layer))) {
      const source = stripComments(read(file));
      for (const banned of forbidden) {
        if (new RegExp(`from\\s+'\\.\\./${banned}/`).test(source)) {
          fail('layers', `${path.relative(SRC, file)}: importa de ../${banned}/ — ${layer} no puede depender de ${banned}`);
        }
      }
    }
  }
}

// ── tokens del tema ────────────────────────────────────────────────────────
function checkTheme() {
  for (const layer of Object.keys(FORBIDDEN_LAYERS)) {
    for (const file of sourceFiles(path.join(SRC, layer))) {
      const rel = path.relative(SRC, file);
      stripComments(read(file))
        .split('\n')
        .forEach((line, index) => {
          // `shadowColor` es la excepción documentada en theme/tokens.ts: el
          // color de sombra por tema es un detalle demasiado fino para
          // resolverlo por paleta.
          if (line.includes('shadowColor')) return;
          if (/#[0-9a-fA-F]{3,8}\b|\brgba?\(/.test(line)) {
            fail('theme', `${rel}:${index + 1}: color hardcodeado — usar theme.colors.*`);
          }
        });
    }
  }
}

// ── matriz de SDK ──────────────────────────────────────────────────────────
function checkSdk() {
  const matrix = read(UI, 'scripts/compat-matrix.mjs');
  const sdks = [...matrix.matchAll(/sdk:\s*'(\d+)'/g)].map((m) => m[1]);
  if (sdks.length === 0) return fail('sdk', 'compat-matrix.mjs: no se pudo leer la MATRIX de SDKs');

  const pkg = JSON.parse(read(UI, 'package.json'));
  const keywords = pkg.keywords.filter((k) => k.startsWith('expo-sdk-')).map((k) => k.replace('expo-sdk-', ''));
  const readme = read(ROOT, 'README.md');

  for (const sdk of sdks) {
    if (!keywords.includes(sdk)) fail('sdk', `SDK ${sdk} está en la matriz pero falta el keyword expo-sdk-${sdk}`);
    if (!readme.includes(sdk)) fail('sdk', `SDK ${sdk} está en la matriz pero el README no lo menciona`);
  }
  for (const keyword of keywords) {
    if (!sdks.includes(keyword)) fail('sdk', `keyword expo-sdk-${keyword} promete un SDK que la matriz no verifica`);
  }
}

// ── flows de Maestro ───────────────────────────────────────────────────────
function checkMaestro() {
  const flowsDir = path.join(EXAMPLE, '.maestro/flows');
  const appId = JSON.parse(read(EXAMPLE, 'app.json')).expo.ios.bundleIdentifier;

  for (const kind of ['smoke', 'behavior']) {
    const dir = path.join(flowsDir, kind);
    for (const name of fs.readdirSync(dir).filter((f) => f.endsWith('.yaml'))) {
      const flow = read(dir, name);
      if (!flow.includes(appId)) fail('maestro', `${kind}/${name}: no apunta al appId ${appId}`);
      for (const match of flow.matchAll(/file:\s*(\S+)/g)) {
        if (!exists(dir, match[1])) fail('maestro', `${kind}/${name}: runFlow apunta a ${match[1]}, que no existe`);
      }
    }
  }
}

const RULES = {
  components: checkComponents,
  count: checkCounts,
  deps: checkDeps,
  layers: checkLayers,
  theme: checkTheme,
  sdk: checkSdk,
  maestro: checkMaestro,
};

function main() {
  const flagIndex = process.argv.indexOf('--rules');
  const only = flagIndex === -1 ? null : new Set(process.argv[flagIndex + 1].split(','));

  for (const [name, check] of Object.entries(RULES)) {
    if (only && !only.has(name)) continue;
    check();
  }

  if (failures.length === 0) {
    console.log(`✓ harness en verde — ${components.length} componentes verificados`);
    return;
  }

  const byRule = new Map();
  for (const { rule, message } of failures) {
    if (!byRule.has(rule)) byRule.set(rule, []);
    byRule.get(rule).push(message);
  }
  for (const [rule, messages] of byRule) {
    console.error(`\n✗ ${rule} (${messages.length})`);
    for (const message of messages) console.error(`  - ${message}`);
  }
  console.error(`\n${failures.length} problema(s). Ver "Adding a component" en AGENTS.md.`);
  process.exit(1);
}

main();
