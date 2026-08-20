const path = require('node:path');
const { getDefaultConfig } = require('expo/metro-config');

const projectRoot = __dirname;
const config = getDefaultConfig(projectRoot);

// En el monorepo conviven varias copias de react, react-native y
// react-native-safe-area-context: las de esta app y las devDependencies de
// packages/ui, que las necesita para correr sus tests. Metro resuelve subiendo
// desde la ubicación del archivo, así que un `import ... from 'react'` adentro
// de packages/ui/src cae en la copia de packages/ui, no en la de la app.
//
// Mientras todas están en la misma versión no se nota. `pnpm sdk 54` deja a
// esta app en react-native 0.81.5 con packages/ui todavía en 0.86.2, y ahí el
// bundle termina con dos copias de cada uno: dos Reacts (hooks rotos), dos
// runtimes de react-native, y dos safe-area-context — que además registra su
// vista nativa dos veces ("Tried to register two views with the same name
// RNCSafeAreaProvider") y parte el contexto de <UIProvider> en dos.
//
// Estos cuatro se fuerzan a la copia de la app, resolviéndolos como si el
// import viniera de la raíz del proyecto. Son exactamente los que packages/ui
// declara como peer: la librería no tiene dependencias de runtime propias, así
// que no hay nada más que pueda duplicarse.
//
// No sirve apagar `disableHierarchicalLookup` entero (la receta de monorepo de
// Expo): con el layout aislado de pnpm cada paquete guarda sus dependencias en
// su propio node_modules hermano dentro de .pnpm, y sin ascenso jerárquico
// expo-router deja de encontrar las suyas.
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
