// @testing-library/react-native >= 12.4 auto-registra sus matchers
// (toBeOnTheScreen, toHaveStyle, ...) al importarse; no existe un subpath
// /extend-expect separado desde entonces.

// react-native preset ya mockea NativeAnimatedHelper en versiones recientes de RN;
// este mock explícito cubre el path interno usado por RN 0.86 y evita el warning
// "Animated: `useNativeDriver` is not supported" en cada test que anima.
jest.mock('react-native/src/private/animated/NativeAnimatedHelper');
