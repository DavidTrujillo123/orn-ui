#!/usr/bin/env node
// Matriz de compatibilidad Expo SDK 54 / 55 / 56 / 57.
//
// El repo se desarrolla contra un solo par (react-native, react): el que trae
// el SDK más nuevo. Eso deja sin verificar el resto del rango que el paquete
// promete en `peerDependencies`, y lo que se rompe de un SDK a otro no son
// sólo los tipos: son APIs de react-native que se mueven de archivo o cambian
// de forma, cosa que `tsc` con skipLibCheck no ve.
//
// Este script arma, por cada SDK, un sandbox aparte con el react-native y el
// react exactos de ese SDK, y corre ahí las dos verificaciones que prueban
// algo: `tsc` contra src/ con esos tipos, y la suite de jest completa contra
// ese runtime. Nada se instala en el workspace: los sandboxes viven en
// node_modules/.cache/ y se reusan entre corridas (--fresh los rehace).
//
// Uso:
//   node scripts/compat-matrix.mjs                 # los cuatro SDK
//   node scripts/compat-matrix.mjs --sdk 54        # uno solo (o 54,55)
//   node scripts/compat-matrix.mjs --fresh         # reinstala los sandboxes
//   node scripts/compat-matrix.mjs --only typecheck
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UI_DIR = path.resolve(__dirname, '..');
const CACHE_DIR = path.join(UI_DIR, 'node_modules', '.cache', 'orn-ui-compat');

// Versiones exactas que publica cada SDK (api.expo.dev/v2/versions/latest,
// campos facebookReactNativeVersion / facebookReactVersion). Al mover el rango
// de SDK soportados, esta tabla y el README son la única fuente de verdad de
// qué promete `peerDependencies`.
const MATRIX = [
  { sdk: '54', reactNative: '0.81.5', react: '19.1.0', safeArea: '5.4.0' },
  { sdk: '55', reactNative: '0.83.10', react: '19.2.0', safeArea: '5.6.2' },
  { sdk: '56', reactNative: '0.85.3', react: '19.2.3', safeArea: '5.8.1' },
  { sdk: '57', reactNative: '0.86.2', react: '19.2.3', safeArea: '5.8.1' },
];

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
    // npm reenvía el separador `--` al script, pnpm 10 lo pasa como argumento
    // literal: en los dos casos no significa nada acá.
    if (arg === '--') continue;
    else if (arg === '--fresh') args.fresh = true;
    else if (arg === '--sdk') args.sdks = (argv[++i] ?? '').split(',').map((s) => s.trim());
    else if (arg === '--only') args.only = argv[++i];
    else fail(`opción desconocida: ${arg}`);
  }
  if (args.only && !['typecheck', 'test'].includes(args.only)) {
    fail(`--only acepta "typecheck" o "test", no "${args.only}"`);
  }
  return args;
}

function run(command, commandArgs, cwd) {
  execFileSync(command, commandArgs, { cwd, stdio: 'inherit' });
}

/** Instala en el sandbox el conjunto exacto de paquetes de ese SDK. */
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
  // node-linker=hoisted deja node_modules/<pkg> en rutas planas, que es lo que
  // esperan los moduleNameMapper de jest y los `paths` de tsc de más abajo.
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
  // @react-native/jest-preset recién se publica como paquete propio desde
  // react-native 0.85; en 0.81–0.84 el preset viene adentro de react-native.
  // En los dos casos `preset: <sandbox>/node_modules/react-native` resuelve
  // react-native/jest-preset.js, que en 0.85+ es un shim al paquete nuevo.
  if (Number(entry.reactNative.split('.')[1]) >= 85) {
    deps.push(`@react-native/jest-preset@${entry.reactNative}`);
  }

  // --ignore-workspace es obligatorio, no cosmético: el sandbox cuelga de
  // packages/ui/node_modules/.cache/, así que sin el flag pnpm sube hasta el
  // pnpm-workspace.yaml del repo, lo adopta como importer y le mete al
  // pnpm-lock.yaml del workspace las dependencias del SDK viejo.
  run('pnpm', ['add', '--ignore-workspace', '--ignore-scripts', ...deps], sandbox);
}

function writeConfigs(sandbox) {
  fs.writeFileSync(
    path.join(sandbox, 'babel.config.js'),
    "module.exports = { presets: [require.resolve('@react-native/babel-preset')] };\n"
  );

  // Mismas opciones que el tsconfig.json del paquete, más `paths`: tsc resuelve
  // desde la ubicación del archivo, y src/ vive en el repo, así que sin esto
  // `react-native` caería en el node_modules del workspace en vez del sandbox.
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
        'react-native': ['./node_modules/react-native/types/index.d.ts'],
        'react-native-safe-area-context': ['./node_modules/react-native-safe-area-context'],
      },
    },
    include: [`${UI_DIR}/src/**/*.ts`, `${UI_DIR}/src/**/*.tsx`],
  };
  fs.writeFileSync(path.join(sandbox, 'tsconfig.json'), `${JSON.stringify(tsconfig, null, 2)}\n`);

  // rootDir es el sandbox (así el preset de react-native resuelve sus propios
  // 'babel-jest' y compañía desde ahí) y `roots` apunta al src/ real.
  const jestConfig = `const path = require('node:path');
const NM = path.join(__dirname, 'node_modules');
const UI = ${JSON.stringify(UI_DIR)};

module.exports = {
  preset: path.join(NM, 'react-native'),
  rootDir: __dirname,
  roots: [path.join(UI, 'src')],
  setupFiles: [path.join(UI, 'jest.setup.ts')],
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
    '^react-native/(.*)$': path.join(NM, 'react-native', '$1'),
    '^react$': path.join(NM, 'react'),
    '^react/(.*)$': path.join(NM, 'react', '$1'),
    '^react-test-renderer$': path.join(NM, 'react-test-renderer'),
    '^react-test-renderer/(.*)$': path.join(NM, 'react-test-renderer', '$1'),
    '^react-native-safe-area-context$': path.join(NM, 'react-native-safe-area-context'),
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
        fail(`no tengo el SDK ${sdk} en la matriz (hay: ${MATRIX.map((m) => m.sdk).join(', ')})`);
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
    console.log('[compat] sandbox ya instalado, se reusa (--fresh para rehacerlo)');
  } else {
    installSandbox(entry, sandbox);
  }
  writeConfigs(sandbox);

  const steps = [
    [
      'typecheck',
      () => run(path.join(sandbox, 'node_modules', '.bin', 'tsc'), ['-p', 'tsconfig.json'], sandbox),
    ],
    [
      'test',
      () => run(path.join(sandbox, 'node_modules', '.bin', 'jest'), ['-c', 'jest.config.js'], sandbox),
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

console.log('\n═══ resumen ═══');
if (failures.length) {
  for (const failure of failures) console.error(`  ✗ ${failure}`);
  process.exit(1);
}
const ran = args.only ? args.only : 'typecheck y tests';
console.log(`  ✓ ${entries.map((e) => `SDK ${e.sdk}`).join(', ')} — ${ran} en verde`);
