import React from 'react';
import { Text } from 'react-native';
import { act, render, screen } from '@testing-library/react-native';
import { SafeAreaUIProvider } from '../SafeAreaUIProvider';
import { UIProvider } from '../../theme/UIProvider';
import { BottomSheet } from '../../organisms/BottomSheet';

// Simula insets distintos entre la ventana raíz y la que abre el modal (el
// caso real: Android abre un Window propio para el Modal nativo; en iOS pasa
// según `presentationStyle`). Devolver siempre el mismo valor no alcanzaría
// para distinguir "usa el boundary re-medido" de "usa el heredado de arriba".
jest.mock('react-native-safe-area-context', () => {
  const actual = jest.requireActual('react-native-safe-area-context');
  return {
    ...actual,
    SafeAreaProvider: ({ children }: { children: React.ReactNode }) => children,
    useSafeAreaInsets: () => ({ top: 59, bottom: 34, left: 0, right: 0 }),
  };
});

beforeEach(() => jest.useFakeTimers());
afterEach(() => {
  act(() => jest.runOnlyPendingTimers());
  jest.useRealTimers();
});

describe('Modal safe area boundary', () => {
  it('BottomSheet ignores an outdated `insets` override and uses the freshly measured ones', () => {
    render(
      <SafeAreaUIProvider insets={{ top: 1, bottom: 2, left: 3, right: 4 }}>
        <BottomSheet visible onClose={() => {}} testID="sheet">
          <Text>content</Text>
        </BottomSheet>
      </SafeAreaUIProvider>
    );
    // paddingBottom = max(insets.bottom, 20); con el override (2) daría 20.
    // Con los insets remedidos (34) tiene que ganar el 34.
    expect(screen.getByTestId('sheet')).toHaveStyle({ paddingBottom: 34 });
  });

  it('a bare UIProvider (sin SafeAreaUIProvider) sigue usando los insets ambientes, sin romper', () => {
    render(
      <UIProvider insets={{ top: 1, bottom: 2, left: 3, right: 4 }}>
        <BottomSheet visible onClose={() => {}} testID="sheet">
          <Text>content</Text>
        </BottomSheet>
      </UIProvider>
    );
    expect(screen.getByTestId('sheet')).toHaveStyle({ paddingBottom: 20 });
  });
});
