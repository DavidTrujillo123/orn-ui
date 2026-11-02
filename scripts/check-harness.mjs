#!/usr/bin/env node
// Repo harness: checks in a single pass the rules that a stray change breaks
// without anything failing — the ones you have to reread in AGENTS.md
// precisely because no compiler looks at them.
//
// Usage:
//   node scripts/check-harness.mjs          # everything
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

/** .ts/.tsx files under `dir`, excluding tests. */
function sourceFiles(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === '__tests__') continue;
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) sourceFiles(abs, out);
    else if (/\.tsx?$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name)) out.push(abs);
  }
  return out;
}

/** Strips line and block comments: a `#fff` quoted in a comment isn't a hardcoded color. */
function stripComments(source) {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
}

// ── components ─────────────────────────────────────────────────────────────
const components = discoverComponents(SRC);

/**
 * Components that don't have their own demo/test/slug because they live
 * inside another (a provider and its component, a field and its picker). It's
 * not an oversight: the file that covers them has to exist and name them, and
 * that's what's checked. Adding an entry here is a deliberate decision, not a
 * way to skip the checklist.
 */
const SHARED = {
  Title: { slug: 'typography' },
  AlertProvider: { demo: 'Alert', slug: 'alert' },
  ToastProvider: { demo: 'Toast', test: 'Toast', slug: 'toast' },
  DateField: { demo: 'DatePicker', test: 'DatePicker', slug: 'date-picker' },
};

/** Does the file use the component, either by its name or by one of those it exports with it? */
function mentionsAny(source, { name, siblingNames }) {
  return [name, ...siblingNames].some((n) => new RegExp(`\\b${n}\\b`).test(source));
}

/** Slice of the demos manifest that corresponds to a category (ATOMS/MOLECULES/ORGANISMS). */
function manifestSection(manifest, category) {
  const order = ['ATOMS', 'MOLECULES', 'ORGANISMS'];
  const index = order.indexOf(category.toUpperCase());
  const start = manifest.indexOf(`export const ${order[index]}`);
  if (start === -1) return '';
  const next = order[index + 1] ? manifest.indexOf(`export const ${order[index + 1]}`) : -1;
  return manifest.slice(start, next === -1 ? undefined : next);
}

/** All the example app's code concatenated, to ask "is this used anywhere?". */
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
      fail('test', `${name}: missing packages/ui/src/${category}/__tests__/${testBase}.test.tsx`);
    } else if (shared.test && !read(testFile).includes(name)) {
      fail('test', `${name}: ${testBase}.test.tsx should cover it and doesn't even name it`);
    }

    const demoFile = path.join(EXAMPLE, 'demos', `${demoBase}.demo.tsx`);
    if (!exists(demoFile)) {
      fail('demo', `${name}: missing apps/example/demos/${demoBase}.demo.tsx`);
    }

    // The paired demo is enough for navigation, but what proves the component
    // is really exercised is that the app uses it somewhere: a provider shows
    // up mounted in the layout, a hook inside an example.
    if (!mentionsAny(exampleSources, component)) {
      fail('demo', `${name}: no file in apps/example uses it (neither it nor the names it exports)`);
    }

    const section = manifestSection(manifest, category);
    if (!section.includes(`slug: '${slug}'`)) {
      fail('demo', `${name}: no slug: '${slug}' entry in ${category.toUpperCase()} of demos/manifest.ts`);
    }

    if (!exists(EXAMPLE, '.maestro/flows/smoke', `${category}-${slug}.yaml`)) {
      fail('maestro', `${name}: missing .maestro/flows/smoke/${category}-${slug}.yaml (run pnpm --filter example gen:maestro)`);
    }

    for (const [label, doc] of [
      ['README.md', rootReadme],
      ['packages/ui/README.md', uiReadme],
      ['packages/ui/AGENTS.md', agents],
      ['packages/ui/llms.txt', llms],
    ]) {
      const mentioned = label.endsWith('llms.txt') ? new RegExp(`\\b${name}\\b`).test(doc) : doc.includes(`\`${name}\``);
      if (!mentioned) fail('docs', `${name}: no row/mention in ${label}`);
    }
  }
}

// ── counts ─────────────────────────────────────────────────────────────────
// The root README's table is the source: one component per row, and rows
// grouping several names (`Title`/`Subtitle`/...) count once per name.
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
      fail('count', `${label}: component count not found (${re})`);
    } else if (Number(match[1]) !== expected) {
      fail('count', `${label}: says ${match[1]} components, the README table lists ${expected}`);
    }
  }

  const missing = components.filter((c) => !documentedNames().has(c.name));
  for (const c of missing) fail('count', `${c.name}: exported by the barrel but has no row in the root README table`);
}

// ── zero dependencies ──────────────────────────────────────────────────────
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
      // The only exception: UIProvider measures the insets with
      // react-native-safe-area-context, a declared required peer.
      if (SAFE_AREA_ONLY.test(spec) && rel === path.join('theme', 'UIProvider.tsx')) continue;
      fail('deps', `${rel}: imports '${spec}' — src/ may only import react and react-native`);
    }
  }
}

// ── atomic design ──────────────────────────────────────────────────────────
// Layers go in one direction only: an atom that imports an organism stops
// being an atom, and the registry (which resolves dependencies per file)
// starts dragging half the catalog along for one component.
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
          fail('layers', `${path.relative(SRC, file)}: imports from ../${banned}/ — ${layer} can't depend on ${banned}`);
        }
      }
    }
  }
}

// ── theme tokens ───────────────────────────────────────────────────────────
function checkTheme() {
  for (const layer of Object.keys(FORBIDDEN_LAYERS)) {
    for (const file of sourceFiles(path.join(SRC, layer))) {
      const rel = path.relative(SRC, file);
      stripComments(read(file))
        .split('\n')
        .forEach((line, index) => {
          // `shadowColor` is the exception documented in theme/tokens.ts: a
          // per-theme shadow color is too fine a detail to resolve per palette.
          if (line.includes('shadowColor')) return;
          if (/#[0-9a-fA-F]{3,8}\b|\brgba?\(/.test(line)) {
            fail('theme', `${rel}:${index + 1}: hardcoded color — use theme.colors.*`);
          }
        });
    }
  }
}

// ── SDK matrix ─────────────────────────────────────────────────────────────
function checkSdk() {
  const matrix = read(UI, 'scripts/compat-matrix.mjs');
  const sdks = [...matrix.matchAll(/sdk:\s*'(\d+)'/g)].map((m) => m[1]);
  if (sdks.length === 0) return fail('sdk', 'compat-matrix.mjs: could not read the SDK MATRIX');

  const pkg = JSON.parse(read(UI, 'package.json'));
  const keywords = pkg.keywords.filter((k) => k.startsWith('expo-sdk-')).map((k) => k.replace('expo-sdk-', ''));
  const readme = read(ROOT, 'README.md');

  for (const sdk of sdks) {
    if (!keywords.includes(sdk)) fail('sdk', `SDK ${sdk} is in the matrix but the expo-sdk-${sdk} keyword is missing`);
    if (!readme.includes(sdk)) fail('sdk', `SDK ${sdk} is in the matrix but the README doesn't mention it`);
  }
  for (const keyword of keywords) {
    if (!sdks.includes(keyword)) fail('sdk', `keyword expo-sdk-${keyword} promises an SDK the matrix doesn't verify`);
  }
}

// ── Maestro flows ──────────────────────────────────────────────────────────
function checkMaestro() {
  const flowsDir = path.join(EXAMPLE, '.maestro/flows');
  const appId = JSON.parse(read(EXAMPLE, 'app.json')).expo.ios.bundleIdentifier;

  for (const kind of ['smoke', 'behavior']) {
    const dir = path.join(flowsDir, kind);
    for (const name of fs.readdirSync(dir).filter((f) => f.endsWith('.yaml'))) {
      const flow = read(dir, name);
      if (!flow.includes(appId)) fail('maestro', `${kind}/${name}: doesn't point to appId ${appId}`);
      for (const match of flow.matchAll(/file:\s*(\S+)/g)) {
        if (!exists(dir, match[1])) fail('maestro', `${kind}/${name}: runFlow points to ${match[1]}, which doesn't exist`);
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
    console.log(`✓ harness green — ${components.length} components verified`);
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
  console.error(`\n${failures.length} problem(s). See "Adding a component" in AGENTS.md.`);
  process.exit(1);
}

main();
