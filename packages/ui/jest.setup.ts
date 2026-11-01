// @testing-library/react-native >= 12.4 auto-registra sus matchers
// (toBeOnTheScreen, toHaveStyle, ...) al importarse; no existe un subpath
// /extend-expect separado desde entonces.

// react-native preset ya mockea NativeAnimatedHelper en versiones recientes de RN;
// este mock explícito cubre el path interno usado por RN 0.81–0.86 (Expo SDK
// 54 a 57, todo el rango que verifica scripts/compat-matrix.mjs) y evita el
// warning "Animated: `useNativeDriver` is not supported" en cada test que anima.
jest.mock('react-native/src/private/animated/NativeAnimatedHelper');

// UIProvider mide los insets con react-native-safe-area-context. Bajo el
// renderer de test no hay ventana nativa: el SafeAreaProvider real no pinta
// sus hijos hasta recibir la primera medición, que nunca llega. El mock
// oficial del paquete le da métricas iniciales en cero. Los tests que
// necesitan insets distintos hacen su propio jest.mock, que gana sobre éste.
jest.mock('react-native-safe-area-context', () =>
  jest.requireActual('react-native-safe-area-context/jest/mock').default
);
