// @testing-library/react-native >= 12.4 auto-registers its matchers
// (toBeOnTheScreen, toHaveStyle, ...) on import; there's been no separate
// /extend-expect subpath since then.

// The react-native preset already mocks NativeAnimatedHelper in recent RN versions;
// this explicit mock covers the internal path used by RN 0.81–0.86 (Expo SDK
// 54 to 57, the whole range scripts/compat-matrix.mjs checks) and avoids the
// "Animated: `useNativeDriver` is not supported" warning in every test that animates.
jest.mock('react-native/src/private/animated/NativeAnimatedHelper');

// UIProvider measures the insets with react-native-safe-area-context. Under
// the test renderer there's no native window: the real SafeAreaProvider
// doesn't paint its children until it gets the first measurement, which
// never arrives. The package's official mock gives it zeroed initial metrics.
// Tests that need different insets do their own jest.mock, which wins over this one.
jest.mock('react-native-safe-area-context', () =>
  jest.requireActual('react-native-safe-area-context/jest/mock').default
);
