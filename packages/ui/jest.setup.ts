// @testing-library/react-native >= 12.4 auto-registra sus matchers
// (toBeOnTheScreen, toHaveStyle, ...) al importarse; no existe un subpath
// /extend-expect separado desde entonces.

// react-native preset ya mockea NativeAnimatedHelper en versiones recientes de RN;
// este mock explícito cubre el path interno usado por RN 0.86 y evita el warning
// "Animated: `useNativeDriver` is not supported" en cada test que anima.
jest.mock('react-native/src/private/animated/NativeAnimatedHelper');

// Casi todos los tests montan <UIProvider> sin `insets` — es lo correcto ahí,
// un renderer sin ventana no tiene safe area que medir. El aviso de dev que eso
// dispara es útil en una app real e inútil acá, y aparecía una vez por archivo
// de test tapando la salida. Se filtra por su texto exacto, no se silencia
// console.warn entero: cualquier otro warning tiene que seguir viéndose.
const realWarn = console.warn;
console.warn = (...args: unknown[]) => {
  if (typeof args[0] === 'string' && args[0].startsWith('orn-ui: <UIProvider> sin `insets`')) return;
  realWarn(...args);
};
