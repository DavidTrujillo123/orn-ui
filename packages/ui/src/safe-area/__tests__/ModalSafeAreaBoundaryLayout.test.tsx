import React from 'react';
import { Text } from 'react-native';
import { act, render, screen, within } from '@testing-library/react-native';
import { SafeAreaUIProvider } from '../SafeAreaUIProvider';
import { BottomSheet } from '../../organisms/BottomSheet';

// Unlike the other boundary test, here `SafeAreaProvider` is NOT a
// passthrough: it mounts a real View, as in the app. That detail is what
// matters — a passthrough hides exactly the regression this file covers
// (the provider added a `flex:1` View around the content, which filled the
// container and sent the BottomSheet to the very top instead of anchoring it
// at the bottom).
jest.mock('react-native-safe-area-context', () => {
  const actual = jest.requireActual('react-native-safe-area-context');
  const { View: RNView } = jest.requireActual('react-native');
  return {
    ...actual,
    SafeAreaProvider: ({ children, style, ...rest }: any) => (
      <RNView testID="safe-area-probe" style={[{ flex: 1 }, style]} {...rest}>
        {children}
      </RNView>
    ),
    useSafeAreaInsets: () => ({ top: 59, bottom: 34, left: 0, right: 0 }),
  };
});

beforeEach(() => jest.useFakeTimers());
afterEach(() => {
  act(() => jest.runOnlyPendingTimers());
  jest.useRealTimers();
});

function renderSheet() {
  return render(
    <SafeAreaUIProvider>
      <BottomSheet visible onClose={() => {}} testID="sheet">
        <Text>content</Text>
      </BottomSheet>
    </SafeAreaUIProvider>
  );
}

// The app root's provider does wrap everything on purpose; the boundary's
// is the one mounted as an absolute layer inside the Modal.
function modalProbe() {
  const probe = screen
    .getAllByTestId('safe-area-probe')
    .find((node) => flattenStyle(node.props?.style)?.position === 'absolute');
  expect(probe).toBeTruthy();
  return probe!;
}

describe('modal safe area boundary layout', () => {
  it('does not wrap the sheet in the measuring SafeAreaProvider', () => {
    renderSheet();
    expect(within(modalProbe()).queryByTestId('sheet')).toBeNull();
  });

  it('mounts the measuring provider as a non-blocking absolute layer', () => {
    renderSheet();
    expect(modalProbe().props.pointerEvents).toBe('none');
  });

  it('keeps the sheet a direct child of the flex-end container', () => {
    renderSheet();
    // Any View with `flex: 1` between the container (flex:1 + flex-end) and the
    // sheet fills the container and lifts the sheet off the bottom edge — which
    // is exactly how it broke: the sheet ended up at the top, under the notch.
    let node = screen.getByTestId('sheet').parent;
    while (node && flattenStyle(node.props?.style)?.justifyContent !== 'flex-end') {
      expect(flattenStyle(node.props?.style)?.flex).not.toBe(1);
      node = node.parent;
    }
    expect(node).toBeTruthy();
  });

  it('still uses the insets measured inside the modal window', () => {
    renderSheet();
    expect(screen.getByTestId('sheet')).toHaveStyle({ paddingBottom: 34 });
  });
});

function flattenStyle(style: unknown): Record<string, any> | null {
  if (!style) return null;
  if (Array.isArray(style)) {
    return style.reduce<Record<string, any>>((acc, item) => ({ ...acc, ...(flattenStyle(item) ?? {}) }), {});
  }
  return typeof style === 'object' ? (style as Record<string, any>) : null;
}
