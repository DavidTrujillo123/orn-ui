#!/usr/bin/env node
// Cambia apps/example entre Expo SDK 54, 55, 56 y 57, y opcionalmente lo
// arranca — un comando en vez de editar package.json a mano y acordarse de qué
// versión de expo-router va con qué SDK.
//
// Es el complemento en dispositivo de packages/ui/scripts/compat-matrix.mjs:
// aquel verifica la librería contra los cuatro SDK con tsc + jest (rápido, sin
// device); este pone la app de ejemplo en ese SDK y la corre de verdad.
//
// Uso:
//   pnpm sdk                 # qué SDK está puesto ahora
//   pnpm sdk 54              # cambia a SDK 54 (reescribe package.json + install)
//   pnpm sdk 54 --go         # cambia y arranca en Expo Go
//   pnpm sdk 54 --export     # cambia y bundlea (verificación sin device)
//   pnpm sdk 54 --ios        # cambia, prebuild --clean y expo run:ios
//   pnpm sdk 54 --android
//   pnpm sdk 54 --no-install # sólo reescribe el manifest
//
// Volver al estado del repo: `pnpm sdk 57` (es el SDK por defecto), o
// `git checkout -- apps/example/package.json pnpm-lock.yaml` si querés
// descartar también los cambios del lockfile.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APP_DIR = path.resolve(__dirname, '..');
const REPO_ROOT = path.resolve(APP_DIR, '..', '..');
const MANIFEST = path.join(APP_DIR, 'package.json');

// Versiones que publica cada SDK. `react-native`/`react` salen de
// api.expo.dev/v2/versions/latest (facebookReactNativeVersion /
// facebookReactVersion) y el resto de
// raw.githubusercontent.com/expo/expo/sdk-<NN>/packages/expo/bundledNativeModules.json
// — o sea, exactamente lo que instalaría `expo install`. Los rangos `~` los
// deja tal cual Expo; react/react-native van clavados porque un patch de
// react-native no es un patch cualquiera.
//
// SDK 54 todavía usa el versionado viejo de los paquetes expo-* (expo-router 6,
// expo-constants 18); desde 55 cada expo-* sigue el número del SDK.
//
// @expo/metro-runtime va explícito aunque la app no lo importe: `expo` lo
// declara como peer `"*"`, y con auto-install-peers (default en pnpm 10) eso
// resuelve a la última versión publicada — 57.x aunque la app esté en SDK 54.
//
// `navigationTheme`: de qué paquete salen ThemeProvider/DarkTheme/DefaultTheme
// en ese SDK (ver components/navigationTheme.ts).
const SDKS = {
  54: {
    navigationTheme: '@react-navigation/native',
    dependencies: {
      '@expo/metro-runtime': '~6.1.2',
      '@react-navigation/native': '^7.1.8',
      expo: '~54.0.0',
      'expo-constants': '~18.0.14',
      'expo-linking': '~8.0.12',
      'expo-router': '~6.0.24',
      'expo-status-bar': '~3.0.9',
      'expo-system-ui': '~6.0.9',
      react: '19.1.0',
      'react-dom': '19.1.0',
      'react-native': '0.81.5',
      'react-native-safe-area-context': '~5.6.0',
      'react-native-screens': '~4.16.0',
      'react-native-web': '~0.21.0',
    },
    devDependencies: { '@types/react': '~19.1.0' },
  },
  55: {
    navigationTheme: '@react-navigation/native',
    dependencies: {
      '@expo/metro-runtime': '~55.0.12',
      '@react-navigation/native': '^7.1.33',
      expo: '~55.0.0',
      'expo-constants': '~55.0.17',
      'expo-linking': '~55.0.17',
      'expo-router': '~55.0.18',
      'expo-status-bar': '~55.0.6',
      'expo-system-ui': '~55.0.21',
      react: '19.2.0',
      'react-dom': '19.2.0',
      'react-native': '0.83.10',
      'react-native-safe-area-context': '~5.6.2',
      'react-native-screens': '~4.23.0',
      'react-native-web': '~0.21.0',
    },
    devDependencies: { '@types/react': '~19.2.0' },
  },
  56: {
    navigationTheme: 'expo-router',
    dependencies: {
      '@expo/metro-runtime': '~56.0.20',
      expo: '~56.0.0',
      'expo-constants': '~56.0.24',
      'expo-linking': '~56.0.17',
      'expo-router': '~56.2.19',
      'expo-status-bar': '~56.0.4',
      'expo-system-ui': '~56.0.5',
      react: '19.2.3',
      'react-dom': '19.2.3',
      'react-native': '0.85.3',
      'react-native-safe-area-context': '~5.7.0',
      'react-native-screens': '~4.26.0',
      'react-native-web': '~0.21.0',
    },
    devDependencies: { '@types/react': '~19.2.14' },
  },
  57: {
    navigationTheme: 'expo-router',
    dependencies: {
      '@expo/metro-runtime': '~57.0.11',
      expo: '~57.0.9',
      'expo-constants': '~57.0.12',
      'expo-linking': '~57.0.6',
      'expo-router': '~57.0.14',
      'expo-status-bar': '~57.0.1',
      'expo-system-ui': '~57.0.2',
      react: '19.2.3',
      'react-dom': '19.2.3',
      'react-native': '0.86.2',
      'react-native-safe-area-context': '~5.8.0',
      'react-native-screens': '~4.26.2',
      'react-native-web': '~0.21.0',
    },
    devDependencies: { '@types/react': '~19.2.14' },
  },
};

const DEFAULT_SDK = '57';

function fail(message) {
  console.error(`[sdk] ${message}`);
  process.exit(1);
}

// `pnpm exec`, nunca `npx`: npx corre el binario que encuentre (y en esta
// máquina está aliasado a `pnpm dlx`, que se baja un expo CLI nuevo del
// registry). El CLI tiene que ser el del SDK que la app declara — uno de SDK 57
// bundleando una app SDK 54 mezcla su propio @react-native/babel-preset con el
// hermesc de la app y el build falla de formas difíciles de leer.
function runExpo(args) {
  execFileSync('pnpm', ['exec', 'expo', ...args], { cwd: APP_DIR, stdio: 'inherit' });
}

function readManifest() {
  return JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
}

/** Deduce el SDK puesto ahora a partir del rango de `expo` en el manifest. */
function currentSdk(manifest) {
  const major = (manifest.dependencies?.expo ?? '').match(/(\d+)\./)?.[1];
  return major && SDKS[major] ? major : null;
}

function sortKeys(object) {
  return Object.fromEntries(Object.entries(object).sort(([a], [b]) => a.localeCompare(b)));
}

/**
 * Aplica el bloque de un SDK sobre las deps actuales. Los paquetes que sólo
 * existen en *algunos* SDK (hoy @react-navigation/native, que hace falta hasta
 * la 55 y sobra desde la 56) se borran antes de mezclar: dejarlo instalado en
 * SDK 57 mete una segunda copia de react-navigation al lado de la que expo-router
 * trae adentro, y el ThemeProvider de una no llega a los navigators de la otra.
 */
function applyBlock(current, block, field) {
  const managed = new Set(Object.values(SDKS).flatMap((sdk) => Object.keys(sdk[field] ?? {})));
  const kept = Object.fromEntries(
    Object.entries(current ?? {}).filter(([name]) => !managed.has(name))
  );
  return sortKeys({ ...kept, ...block });
}

/**
 * Escribe components/navigationTheme.ts apuntando al paquete que expone el
 * theming de react-navigation en ese SDK. Es la única diferencia de código
 * fuente entre SDKs — el resto de la app y toda la librería son iguales.
 */
function writeNavigationTheme(entry, sdk) {
  const file = path.join(APP_DIR, 'components', 'navigationTheme.ts');
  fs.writeFileSync(
    file,
    `// Generado por scripts/use-sdk.mjs — no editar a mano.
// Fuente: Expo SDK ${sdk}
//
// \`ThemeProvider\`/\`DarkTheme\`/\`DefaultTheme\` cambiaron de paquete entre SDKs:
// expo-router los reexporta desde la 56 (SDK 56), y hasta la 55 hay que
// tomarlos de @react-navigation/native, que expo-router 6/55 traen como
// dependencia y las versiones nuevas ya no usan. No hay un import estático que
// resuelva en los cuatro SDK, así que el que corresponde se escribe acá al
// cambiar de SDK y el resto de la app importa siempre desde este archivo.
export { DarkTheme, DefaultTheme, ThemeProvider } from '${entry.navigationTheme}';
`
  );
}

function parseArgs(argv) {
  const args = { sdk: null, target: null, install: true };
  for (const arg of argv) {
    if (arg === '--') continue;
    else if (arg === '--no-install') args.install = false;
    else if (['--go', '--ios', '--android', '--export'].includes(arg)) args.target = arg.slice(2);
    else if (/^-{0,2}\d+$/.test(arg)) {
      // Acepta `54`, `-54` y `--54`: el número es lo que importa, no el guión.
      args.sdk = arg.replace(/^-+/, '');
    } else {
      fail(`no entiendo "${arg}". Uso: pnpm sdk <54|55|56|57> [--go|--export|--ios|--android]`);
    }
  }
  return args;
}

const args = parseArgs(process.argv.slice(2));
const manifest = readManifest();

if (!args.sdk) {
  const current = currentSdk(manifest);
  console.log(
    current
      ? `[sdk] apps/example está en Expo SDK ${current} (expo ${manifest.dependencies.expo}, react-native ${manifest.dependencies['react-native']})`
      : `[sdk] no reconozco el SDK del manifest (expo ${manifest.dependencies?.expo})`
  );
  console.log(`[sdk] disponibles: ${Object.keys(SDKS).join(', ')} — por defecto ${DEFAULT_SDK}`);
  process.exit(0);
}

const target = SDKS[args.sdk];
if (!target) fail(`SDK ${args.sdk} no está en la tabla (hay: ${Object.keys(SDKS).join(', ')})`);

const before = currentSdk(manifest);
// Siempre, incluso si el SDK ya era ese: es un archivo generado, y así una
// copia editada a mano o a medio escribir vuelve a lo que corresponde.
writeNavigationTheme(target, args.sdk);

if (before === args.sdk) {
  console.log(`[sdk] apps/example ya está en SDK ${args.sdk}`);
} else {
  // Merge, no reemplazo: `orn-ui` (workspace:*) y cualquier otra dependencia
  // que no dependa del SDK tienen que sobrevivir el cambio.
  manifest.dependencies = applyBlock(manifest.dependencies, target.dependencies, 'dependencies');
  manifest.devDependencies = applyBlock(
    manifest.devDependencies,
    target.devDependencies,
    'devDependencies'
  );
  fs.writeFileSync(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`[sdk] apps/example: SDK ${before ?? '?'} → ${args.sdk}`);

  if (args.install) {
    // El lockfile es del workspace, así que el install corre desde la raíz
    // aunque el único manifest que cambió sea el de la app.
    //
    // --no-frozen-lockfile explícito: en CI pnpm lo pone en true por defecto y
    // fallaría, que es lo correcto para un install normal pero no acá — el
    // manifest acaba de cambiar a propósito y el lockfile *tiene* que moverse.
    execFileSync('pnpm', ['install', '--no-frozen-lockfile'], {
      cwd: REPO_ROOT,
      stdio: 'inherit',
    });
  } else {
    console.log('[sdk] --no-install: corré `pnpm install` antes de arrancar la app');
  }
}

if (!args.target) process.exit(0);

if (args.target === 'export') {
  // Bundle completo con el Hermes de ese SDK: es la verificación más barata de
  // que el SDK entero (metro + babel + hermesc) quedó consistente, sin device.
  runExpo(['export', '--platform', 'ios', '--output-dir', path.join(APP_DIR, 'dist')]);
} else if (args.target === 'go') {
  // --go fuerza Expo Go: apps/example tiene android/ e ios/ de un prebuild
  // previo, y con eso el CLI arrancaría en modo dev-client por defecto.
  // Necesitás el Expo Go de ese mismo SDK — su número de versión ES el número
  // del SDK desde el 54; en simulador/emulador el CLI lo baja solo.
  runExpo(['start', '--go', '--clear']);
} else {
  // Las carpetas nativas quedaron generadas por el SDK anterior: sin --clean,
  // prebuild las deja como están y el build linkea un react-native que ya no es
  // el del manifest.
  runExpo(['prebuild', '--clean', '--platform', args.target]);
  runExpo([`run:${args.target}`]);
}
