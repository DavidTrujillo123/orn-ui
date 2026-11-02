import React from 'react';
import { Text } from 'react-native';
import { act, render, screen } from '@testing-library/react-native';
import { SafeAreaUIProvider } from '../SafeAreaUIProvider';
import { UIProvider } from '../../theme/UIProvider';
import { BottomSheet } from '../../organisms/BottomSheet';

// Simulates different insets between the root window and the one the modal
// opens (the real case: Android opens its own Window for the native Modal; on
// iOS it depends on `presentationStyle`). Always returning the same value
// wouldn't be enough to tell "uses the re-measured boundary" from "uses the
// one inherited from above".
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
    // paddingBottom = max(insets.bottom, 20); with the override (2) it would be 20.
    // With the re-measured insets (34) the 34 has to win.
    expect(screen.getByTestId('sheet')).toHaveStyle({ paddingBottom: 34 });
  });

  it('a bare UIProvider remeasures too (safe-area-context is a required peer now)', () => {
    render(
      <UIProvider insets={{ top: 1, bottom: 2, left: 3, right: 4 }}>
        <BottomSheet visible onClose={() => {}} testID="sheet">
          <Text>content</Text>
        </BottomSheet>
      </UIProvider>
    );
    expect(screen.getByTestId('sheet')).toHaveStyle({ paddingBottom: 34 });
  });

  it('SafeAreaUIProvider is a deprecated alias of UIProvider', () => {
    expect(SafeAreaUIProvider).toBe(UIProvider);
  });
});
