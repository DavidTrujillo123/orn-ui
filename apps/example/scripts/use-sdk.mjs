#!/usr/bin/env node
// Switches apps/example between Expo SDK 54, 55, 56, 57 and 58, and optionally
// starts it — one command instead of editing package.json by hand and
// remembering which expo-router version goes with which SDK.
//
// It's the on-device complement to packages/ui/scripts/compat-matrix.mjs:
// that one checks the library against every SDK with tsc + jest (fast, no
// device); this one puts the example app on that SDK and actually runs it.
//
// Usage:
//   pnpm sdk                 # which SDK is set right now
//   pnpm sdk 54              # switches to SDK 54 (rewrites package.json + install)
//   pnpm sdk 54 --go         # switches and starts in Expo Go
//   pnpm sdk 54 --export     # switches and bundles (check without a device)
//   pnpm sdk 54 --ios        # switches, prebuild --clean and expo run:ios
//   pnpm sdk 54 --android
//   pnpm sdk 54 --no-install # only rewrites the manifest
//
// Back to the repo's state: `pnpm sdk 58` (it's the default SDK), or
// `git checkout -- apps/example/package.json pnpm-lock.yaml` if you also want
// to discard the lockfile changes.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APP_DIR = path.resolve(__dirname, '..');
const REPO_ROOT = path.resolve(APP_DIR, '..', '..');
const MANIFEST = path.join(APP_DIR, 'package.json');

// Versions each SDK publishes. `react-native`/`react` come from
// api.expo.dev/v2/versions/latest (facebookReactNativeVersion /
// facebookReactVersion) and the rest from
// raw.githubusercontent.com/expo/expo/sdk-<NN>/packages/expo/bundledNativeModules.json
// — that is, exactly what `expo install` would install. The `~` ranges are
// left as Expo has them; react/react-native are pinned because a react-native
// patch isn't just any patch.
//
// SDK 54 still uses the old versioning of the expo-* packages (expo-router 6,
// expo-constants 18); from 55 on each expo-* follows the SDK number.
//
// @expo/metro-runtime is explicit even though the app doesn't import it: `expo`
// declares it as a `"*"` peer, and with auto-install-peers (default in pnpm 10)
// that resolves to the latest published version — 57.x even if the app is on SDK 54.
//
// `navigationTheme`: which package ThemeProvider/DarkTheme/DefaultTheme come
// from on that SDK (see components/navigationTheme.ts).
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
  58: {
    navigationTheme: 'expo-router',
    dependencies: {
      '@expo/metro-runtime': '~58.0.17',
      expo: '~58.0.25',
      'expo-constants': '~58.0.16',
      'expo-linking': '~58.0.17',
      'expo-router': '~58.0.31',
      'expo-status-bar': '~58.0.5',
      'expo-system-ui': '~58.0.7',
      react: '19.3.0',
      'react-dom': '19.3.0',
      'react-native': '0.88.1',
      'react-native-safe-area-context': '~5.11.1',
      'react-native-screens': '~4.30.1',
      'react-native-web': '~0.21.4',
      // expo-router's optional peers: left to auto-install-peers, pnpm picks
      // reanimated 4.5 / worklets 0.11, which stop at react-native 0.86.
      '@expo/dom-webview': '~58.0.2',
      'react-native-reanimated': '4.7.1',
      'react-native-worklets': '0.13.0',
    },
    devDependencies: { '@types/react': '~19.3.0' },
  },
};

const DEFAULT_SDK = '58';

function fail(message) {
  console.error(`[sdk] ${message}`);
  process.exit(1);
}

// `pnpm exec`, never `npx`: npx runs whatever binary it finds (and on this
// machine it's aliased to `pnpm dlx`, which downloads a fresh expo CLI from
// the registry). The CLI has to be the one for the SDK the app declares — an
// SDK 57 one bundling an SDK 54 app mixes its own @react-native/babel-preset
// with the app's hermesc and the build fails in hard-to-read ways.
function runExpo(args) {
  execFileSync('pnpm', ['exec', 'expo', ...args], { cwd: APP_DIR, stdio: 'inherit' });
}

function readManifest() {
  return JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
}

/** Infers the currently set SDK from the `expo` range in the manifest. */
function currentSdk(manifest) {
  const major = (manifest.dependencies?.expo ?? '').match(/(\d+)\./)?.[1];
  return major && SDKS[major] ? major : null;
}

function sortKeys(object) {
  return Object.fromEntries(Object.entries(object).sort(([a], [b]) => a.localeCompare(b)));
}

/**
 * Applies an SDK's block over the current deps. Packages that only exist on
 * *some* SDKs (today @react-navigation/native, needed up to 55 and
 * unnecessary from 56) are deleted before merging: leaving it installed on
 * SDK 57 adds a second copy of react-navigation next to the one expo-router
 * ships inside, and one's ThemeProvider doesn't reach the other's navigators.
 */
function applyBlock(current, block, field) {
  const managed = new Set(Object.values(SDKS).flatMap((sdk) => Object.keys(sdk[field] ?? {})));
  const kept = Object.fromEntries(
    Object.entries(current ?? {}).filter(([name]) => !managed.has(name))
  );
  return sortKeys({ ...kept, ...block });
}

/**
 * Writes components/navigationTheme.ts pointing to the package that exposes
 * react-navigation's theming on that SDK. It's the only source code
 * difference between SDKs — the rest of the app and the whole library are the same.
 */
function writeNavigationTheme(entry, sdk) {
  const file = path.join(APP_DIR, 'components', 'navigationTheme.ts');
  fs.writeFileSync(
    file,
    `// Generated by scripts/use-sdk.mjs — do not edit by hand.
// Source: Expo SDK ${sdk}
//
// \`ThemeProvider\`/\`DarkTheme\`/\`DefaultTheme\` moved between packages across SDKs:
// expo-router re-exports them since 56 (SDK 56), and up to 55 they have to be
// taken from @react-navigation/native, which expo-router 6/55 ship as a
// dependency and newer versions no longer use. There's no static import that
// resolves on all four SDKs, so the right one is written here when switching
// SDK and the rest of the app always imports from this file.
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
      // Accepts `54`, `-54` and `--54`: the number is what matters, not the dash.
      args.sdk = arg.replace(/^-+/, '');
    } else {
      fail(`don't understand "${arg}". Usage: pnpm sdk <54|55|56|57> [--go|--export|--ios|--android]`);
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
      ? `[sdk] apps/example is on Expo SDK ${current} (expo ${manifest.dependencies.expo}, react-native ${manifest.dependencies['react-native']})`
      : `[sdk] can't recognize the manifest's SDK (expo ${manifest.dependencies?.expo})`
  );
  console.log(`[sdk] available: ${Object.keys(SDKS).join(', ')} — default ${DEFAULT_SDK}`);
  process.exit(0);
}

const target = SDKS[args.sdk];
if (!target) fail(`SDK ${args.sdk} is not in the table (available: ${Object.keys(SDKS).join(', ')})`);

const before = currentSdk(manifest);
// Always, even if the SDK was already that one: it's a generated file, and
// this way a hand-edited or half-written copy goes back to what it should be.
writeNavigationTheme(target, args.sdk);

// Merge, not replace: `orn-ui` (workspace:*) and any other dependency that
// doesn't depend on the SDK have to survive the switch. Applied even when the
// SDK is already that one: a half-updated manifest (a pin added to the table
// later, say) is put back in line too.
const nextManifest = {
  ...manifest,
  dependencies: applyBlock(manifest.dependencies, target.dependencies, 'dependencies'),
  devDependencies: applyBlock(manifest.devDependencies, target.devDependencies, 'devDependencies'),
};
let changed = JSON.stringify(nextManifest) !== JSON.stringify(manifest);
if (changed) fs.writeFileSync(MANIFEST, `${JSON.stringify(nextManifest, null, 2)}\n`);

// The workspace root also declares expo/react/react-native (so the expo CLI
// resolves from the root): left behind, pnpm hoists the old SDK's
// react-native next to the new one and jest/tsc pick the wrong copy.
const ROOT_MANIFEST = path.join(REPO_ROOT, 'package.json');
const root = JSON.parse(fs.readFileSync(ROOT_MANIFEST, 'utf8'));
let rootChanged = false;
for (const name of ['expo', 'react', 'react-native']) {
  if (root.dependencies?.[name] && root.dependencies[name] !== target.dependencies[name]) {
    root.dependencies[name] = target.dependencies[name];
    rootChanged = true;
  }
}
if (rootChanged) fs.writeFileSync(ROOT_MANIFEST, `${JSON.stringify(root, null, 2)}\n`);
changed = changed || rootChanged;

if (!changed) {
  console.log(`[sdk] apps/example is already on SDK ${args.sdk}`);
} else {
  console.log(`[sdk] apps/example: SDK ${before ?? '?'} → ${args.sdk}`);

  if (args.install) {
    // The lockfile belongs to the workspace, so the install runs from the root.
    //
    // Explicit --no-frozen-lockfile: in CI pnpm sets it to true by default and
    // it would fail, which is right for a normal install but not here — the
    // manifest has just changed on purpose and the lockfile *has* to move.
    execFileSync('pnpm', ['install', '--no-frozen-lockfile'], {
      cwd: REPO_ROOT,
      stdio: 'inherit',
    });
  } else {
    console.log('[sdk] --no-install: run `pnpm install` before starting the app');
  }
}

if (!args.target) process.exit(0);

if (args.target === 'export') {
  // Full bundle with that SDK's Hermes: it's the cheapest check that the
  // whole SDK (metro + babel + hermesc) ended up consistent, without a device.
  runExpo(['export', '--platform', 'ios', '--output-dir', path.join(APP_DIR, 'dist')]);
} else if (args.target === 'go') {
  // --go forces Expo Go: apps/example has android/ and ios/ from a previous
  // prebuild, and with that the CLI would start in dev-client mode by default.
  // You need the Expo Go for that same SDK — its version number IS the SDK
  // number since 54; on a simulator/emulator the CLI downloads it on its own.
  runExpo(['start', '--go', '--clear']);
} else {
  // The native folders were generated by the previous SDK: without --clean,
  // prebuild leaves them as they are and the build links a react-native that
  // is no longer the manifest's.
  runExpo(['prebuild', '--clean', '--platform', args.target]);
  runExpo([`run:${args.target}`]);
}
