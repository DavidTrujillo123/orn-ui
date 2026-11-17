#!/usr/bin/env node
// Compatibility matrix for Expo SDK 54 / 55 / 56 / 57 / 58.
//
// The repo is developed against a single pair (react-native, react): the one
// shipped by the newest SDK. That leaves the rest of the range the package
// promises in `peerDependencies` unverified, and what breaks from one SDK to
// another isn't just the types: it's react-native APIs that move files or
// change shape, which `tsc` with skipLibCheck doesn't see.
//
// For each SDK, this script builds a separate sandbox with that SDK's exact
// react-native and react, and runs there the two checks that prove
// something: `tsc` against src/ with those types, and the full jest suite
// against that runtime. Nothing is installed in the workspace: the sandboxes
// live in node_modules/.cache/ and are reused between runs (--fresh rebuilds them).
//
// Usage:
//   node scripts/compat-matrix.mjs                 # every SDK in MATRIX
//   node scripts/compat-matrix.mjs --sdk 54        # just one (or 54,55)
//   node scripts/compat-matrix.mjs --fresh         # reinstalls the sandboxes
//   node scripts/compat-matrix.mjs --only typecheck
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UI_DIR = path.resolve(__dirname, '..');
const CACHE_DIR = path.join(UI_DIR, 'node_modules', '.cache', 'orn-ui-compat');

// Exact versions each SDK publishes (api.expo.dev/v2/versions/latest,
// fields facebookReactNativeVersion / facebookReactVersion). When moving the
// supported SDK range, this table and the README are the only source of truth
// for what `peerDependencies` promises.
const MATRIX = [
  { sdk: '54', reactNative: '0.81.5', react: '19.1.0', safeArea: '5.4.0' },
  { sdk: '55', reactNative: '0.83.10', react: '19.2.0', safeArea: '5.6.2' },
  { sdk: '56', reactNative: '0.85.3', react: '19.2.3', safeArea: '5.8.1' },
  { sdk: '57', reactNative: '0.86.2', react: '19.2.3', safeArea: '5.8.1' },
  { sdk: '58', reactNative: '0.88.1', react: '19.3.0', safeArea: '5.11.1' },
];

/** Minor of the SDK's react-native (0.88.1 -> 88). */
function rnMinor(entry) {
  return Number(entry.reactNative.split('.')[1]);
}

function rnTypesEntry(entry) {
  return rnMinor(entry) >= 88
    ? './node_modules/react-native/types_generated/index.d.ts'
    : './node_modules/react-native/types/index.d.ts';
}

const TYPESCRIPT = '5.9.3';
const JEST = '29.7.0';
const BABEL_CORE = '7.29.7';
const BABEL_RUNTIME = '7.29.7';
const TESTING_LIBRARY = '13.3.3';
const TYPES_JEST = '29.5.14';

function fail(message) {
  console.error(`[compat] ${message}`);
  process.exit(1);
}

function parseArgs(argv) {
  const args = { sdks: null, fresh: false, only: null };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    // npm forwards the `--` separator to the script, pnpm 10 passes it as a
    // literal argument: in both cases it means nothing here.
    if (arg === '--') continue;
    else if (arg === '--fresh') args.fresh = true;
    else if (arg === '--sdk') args.sdks = (argv[++i] ?? '').split(',').map((s) => s.trim());
    else if (arg === '--only') args.only = argv[++i];
    else fail(`unknown option: ${arg}`);
  }
  if (args.only && !['typecheck', 'test'].includes(args.only)) {
    fail(`--only accepts "typecheck" or "test", not "${args.only}"`);
  }
  return args;
}

function run(command, commandArgs, cwd) {
  execFileSync(command, commandArgs, { cwd, stdio: 'inherit' });
}

/** Installs that SDK's exact set of packages in the sandbox. */
function installSandbox(entry, sandbox) {
  fs.mkdirSync(sandbox, { recursive: true });
  fs.writeFileSync(
    path.join(sandbox, 'package.json'),
    `${JSON.stringify(
      { name: `orn-ui-compat-sdk${entry.sdk}`, private: true, version: '0.0.0' },
      null,
      2
    )}\n`
  );
  // node-linker=hoisted leaves node_modules/<pkg> at flat paths, which is what
  // jest's moduleNameMapper and tsc's `paths` further down expect.
  fs.writeFileSync(
    path.join(sandbox, '.npmrc'),
    'node-linker=hoisted\nstrict-peer-dependencies=false\n'
  );

  const deps = [
    `react-native@${entry.reactNative}`,
    `react@${entry.react}`,
    `@types/react@${entry.react}`,
    `react-native-safe-area-context@${entry.safeArea}`,
    `typescript@${TYPESCRIPT}`,
    `jest@${JEST}`,
    `babel-jest@${JEST}`,
    `@babel/core@${BABEL_CORE}`,
    `@babel/runtime@${BABEL_RUNTIME}`,
    `@react-native/babel-preset@${entry.reactNative}`,
    `@testing-library/react-native@${TESTING_LIBRARY}`,
    `react-test-renderer@${entry.react}`,
    `@types/jest@${TYPES_JEST}`,
  ];
  // @react-native/jest-preset is only published as its own package starting
  // with react-native 0.85; in 0.81–0.84 the preset ships inside react-native.
  // In both cases `preset: <sandbox>/node_modules/react-native` resolves
  // react-native/jest-preset.js, which in 0.85+ is a shim to the new package.
  if (rnMinor(entry) >= 85) {
    deps.push(`@react-native/jest-preset@${entry.reactNative}`);
  }

  // --ignore-workspace is required, not cosmetic: the sandbox hangs off
  // packages/ui/node_modules/.cache/, so without the flag pnpm walks up to the
  // repo's pnpm-workspace.yaml, adopts it as an importer and puts the old
  // SDK's dependencies into the workspace's pnpm-lock.yaml.
  run('pnpm', ['add', '--ignore-workspace', '--ignore-scripts', ...deps], sandbox);
}

function writeConfigs(entry, sandbox) {
  fs.writeFileSync(
    path.join(sandbox, 'babel.config.js'),
    "module.exports = { presets: [require.resolve('@react-native/babel-preset')] };\n"
  );

  // Same options as the package's tsconfig.json, plus `paths`: tsc resolves
  // from the file's location, and src/ lives in the repo, so without this
  // `react-native` would land in the workspace's node_modules instead of the sandbox.
  const tsconfig = {
    compilerOptions: {
      target: 'esnext',
      lib: ['esnext'],
      module: 'esnext',
      moduleResolution: 'bundler',
      jsx: 'react-jsx',
      strict: true,
      noUncheckedIndexedAccess: true,
      esModuleInterop: true,
      skipLibCheck: true,
      resolveJsonModule: true,
      forceConsistentCasingInFileNames: true,
      isolatedModules: true,
      noFallthroughCasesInSwitch: true,
      noEmit: true,
      baseUrl: '.',
      typeRoots: ['./node_modules/@types'],
      types: ['jest'],
      paths: {
        react: ['./node_modules/@types/react'],
        'react/*': ['./node_modules/@types/react/*'],
        // The types an app on that SDK compiles against: up to 0.87 they are
        // `types/`; 0.88 moved those to `types_DEPRECATED/` and its default
        // (package `exports`) is the generated, stricter `types_generated/`.
        'react-native': [rnTypesEntry(entry)],
        'react-native-safe-area-context': ['./node_modules/react-native-safe-area-context'],
      },
    },
    include: [`${UI_DIR}/src/**/*.ts`, `${UI_DIR}/src/**/*.tsx`],
  };
  fs.writeFileSync(path.join(sandbox, 'tsconfig.json'), `${JSON.stringify(tsconfig, null, 2)}\n`);

  // rootDir is the sandbox (so the react-native preset resolves its own
  // 'babel-jest' and friends from there) and `roots` points to the real src/.
  const jestConfig = `const path = require('node:path');
const NM = path.join(__dirname, 'node_modules');
const UI = ${JSON.stringify(UI_DIR)};

module.exports = {
  // react-native 0.88 no longer ships jest-preset.js: the preset is only the
  // @react-native/jest-preset package.
  preset: path.join(NM, ${JSON.stringify(rnMinor(entry) >= 88 ? '@react-native/jest-preset' : 'react-native')}),
  rootDir: __dirname,
  roots: [path.join(UI, 'src')],
  setupFiles: [path.join(UI, 'jest.setup.ts')],
  // Same as jest.config.js: resets NativeOverlay's registry before each test.
  setupFilesAfterEnv: [path.join(UI, 'jest.after-env.ts')],
  testPathIgnorePatterns: ['/node_modules/', '/lib/'],
  transformIgnorePatterns: [],
  transform: {
    '\\\\.[jt]sx?$': [
      require.resolve('babel-jest'),
      { configFile: path.join(__dirname, 'babel.config.js') },
    ],
  },
  moduleNameMapper: {
    '^react-native$': path.join(NM, 'react-native'),
    // 0.88 resolves subpaths (react-native/setup-env…) through package
    // \`exports\`: a plain path mapping points them at files that don't exist.
    ${rnMinor(entry) >= 88 ? '' : "'^react-native/(.*)$': path.join(NM, 'react-native', '$1'),"}
    '^react$': path.join(NM, 'react'),
    '^react/(.*)$': path.join(NM, 'react', '$1'),
    '^react-test-renderer$': path.join(NM, 'react-test-renderer'),
    '^react-test-renderer/(.*)$': path.join(NM, 'react-test-renderer', '$1'),
    '^react-native-safe-area-context$': path.join(NM, 'react-native-safe-area-context'),
    // jest.setup.ts loads its jest mock by subpath: unmapped, it came from the
    // workspace's copy (another safe-area, built against another React).
    '^react-native-safe-area-context/(.*)$': path.join(NM, 'react-native-safe-area-context', '$1'),
    '^@testing-library/react-native$': path.join(NM, '@testing-library', 'react-native'),
    '^@babel/runtime/(.*)$': path.join(NM, '@babel', 'runtime', '$1'),
  },
};
`;
  fs.writeFileSync(path.join(sandbox, 'jest.config.js'), jestConfig);
}

const args = parseArgs(process.argv.slice(2));
const entries = args.sdks
  ? args.sdks.map((sdk) => {
      const hit = MATRIX.find((m) => m.sdk === sdk);
      if (!hit) {
        fail(`SDK ${sdk} is not in the matrix (available: ${MATRIX.map((m) => m.sdk).join(', ')})`);
      }
      return hit;
    })
  : MATRIX;

const failures = [];

for (const entry of entries) {
  const sandbox = path.join(CACHE_DIR, `sdk${entry.sdk}`);
  const label = `SDK ${entry.sdk} (react-native ${entry.reactNative}, react ${entry.react})`;
  console.log(`\n═══ ${label} ═══`);

  if (args.fresh) fs.rmSync(sandbox, { recursive: true, force: true });
  if (fs.existsSync(path.join(sandbox, 'node_modules', 'react-native'))) {
    console.log('[compat] sandbox already installed, reusing it (--fresh to rebuild it)');
  } else {
    installSandbox(entry, sandbox);
  }
  writeConfigs(entry, sandbox);

  // On Windows the .bin shims are not executable through execFileSync;
  // calling the node entrypoints directly works on all three platforms.
  const steps = [
    [
      'typecheck',
      () =>
        run(
          process.execPath,
          [path.join(sandbox, 'node_modules', 'typescript', 'bin', 'tsc'), '-p', 'tsconfig.json'],
          sandbox
        ),
    ],
    [
      'test',
      () =>
        run(
          process.execPath,
          [
            path.join(sandbox, 'node_modules', 'jest', 'bin', 'jest.js'),
            '-c',
            'jest.config.js',
            // Jest's default cache lives in %TEMP%, shared by every sandbox. On
            // Windows a lock from another run surfaces as EPERM; keep it local.
            '--cacheDirectory',
            path.join(sandbox, '.jest-cache'),
          ],
          sandbox
        ),
    ],
  ].filter(([name]) => !args.only || args.only === name);

  for (const [name, step] of steps) {
    console.log(`\n[compat] ${label} — ${name}`);
    try {
      step();
    } catch {
      failures.push(`${label} — ${name}`);
    }
  }
}

console.log('\n═══ summary ═══');
if (failures.length) {
  for (const failure of failures) console.error(`  ✗ ${failure}`);
  process.exit(1);
}
const ran = args.only ? args.only : 'typecheck y tests';
console.log(`  ✓ ${entries.map((e) => `SDK ${e.sdk}`).join(', ')} — ${ran} green`);
