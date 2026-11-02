const path = require('node:path');
const { getDefaultConfig } = require('expo/metro-config');

const projectRoot = __dirname;
const config = getDefaultConfig(projectRoot);

// Several copies of react, react-native and react-native-safe-area-context
// live side by side in the monorepo: this app's and packages/ui's
// devDependencies, which it needs to run its tests. Metro resolves by walking
// up from the file's location, so an `import ... from 'react'` inside
// packages/ui/src lands in packages/ui's copy, not the app's.
//
// While they are all on the same version it goes unnoticed. `pnpm sdk 54`
// puts this app on react-native 0.81.5 with packages/ui still on 0.86.2, and
// then the bundle ends up with two copies of each: two Reacts (broken hooks),
// two react-native runtimes, and two safe-area-contexts — which also
// registers its native view twice ("Tried to register two views with the
// same name RNCSafeAreaProvider") and splits <UIProvider>'s context in two.
//
// These four are forced to the app's copy, resolving them as if the import
// came from the project root. They are exactly the ones packages/ui declares
// as peers: the library has no runtime dependencies of its own, so there is
// nothing else that could be duplicated.
//
// Turning off `disableHierarchicalLookup` entirely (Expo's monorepo recipe)
// doesn't work: with pnpm's isolated layout each package keeps its
// dependencies in its own sibling node_modules inside .pnpm, and without
// hierarchical lookup expo-router stops finding its own.
const SINGLETONS = new Set([
  'react',
  'react-dom',
  'react-native',
  'react-native-safe-area-context',
]);
const appOrigin = path.join(projectRoot, 'package.json');

const defaultResolveRequest = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  const resolve = defaultResolveRequest ?? context.resolveRequest;
  const packageName = moduleName.split('/', 1)[0];
  if (SINGLETONS.has(packageName)) {
    return resolve({ ...context, originModulePath: appOrigin }, moduleName, platform);
  }
  return resolve(context, moduleName, platform);
};

module.exports = config;
