import React from 'react';
import { Text } from 'react-native';
import { render } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SafeAreaUIProvider } from '../SafeAreaUIProvider';
import { useInsets, useThemeMode } from '../../theme/UIProvider';

// react-native-safe-area-context measures nothing under the test renderer:
// without this mock useSafeAreaInsets returns zeros and "it measured" couldn't
// be told apart from "it kept UIProvider's default", which is exactly what we need to test.
jest.mock('react-native-safe-area-context', () => {
  const actual = jest.requireActual('react-native-safe-area-context');
  return {
    ...actual,
    SafeAreaProvider: ({ children }: { children: React.ReactNode }) => children,
    useSafeAreaInsets: () => ({ top: 59, bottom: 34, left: 0, right: 0 }),
  };
});

function ShowInsets() {
  const insets = useInsets();
  return <Text>{`${insets.top}/${insets.bottom}`}</Text>;
}

function ShowMode() {
  const { mode } = useThemeMode();
  return <Text>{mode}</Text>;
}

describe('SafeAreaUIProvider', () => {
  it('feeds the measured insets into the UI context', () => {
    const { getByText } = render(
      <SafeAreaUIProvider>
        <ShowInsets />
      </SafeAreaUIProvider>
    );
    expect(getByText('59/34')).toBeTruthy();
  });

  it('lets an explicit insets prop win over the measured ones', () => {
    const { getByText } = render(
      <SafeAreaUIProvider insets={{ top: 1, bottom: 2, left: 3, right: 4 }}>
        <ShowInsets />
      </SafeAreaUIProvider>
    );
    expect(getByText('1/2')).toBeTruthy();
  });

  it('consumes an outer provider when mountSafeAreaProvider is false', () => {
    const { getByText } = render(
      <SafeAreaProvider>
        <SafeAreaUIProvider mountSafeAreaProvider={false}>
          <ShowInsets />
        </SafeAreaUIProvider>
      </SafeAreaProvider>
    );
    expect(getByText('59/34')).toBeTruthy();
  });

  it('forwards the remaining UIProvider props', () => {
    const { getByText } = render(
      <SafeAreaUIProvider defaultMode="dark">
        <ShowMode />
      </SafeAreaUIProvider>
    );
    expect(getByText('dark')).toBeTruthy();
  });
});
