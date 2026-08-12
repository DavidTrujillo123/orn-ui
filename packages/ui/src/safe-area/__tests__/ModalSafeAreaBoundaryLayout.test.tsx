import React from 'react';
import { Text } from 'react-native';
import { act, render, screen, within } from '@testing-library/react-native';
import { SafeAreaUIProvider } from '../SafeAreaUIProvider';
import { BottomSheet } from '../../organisms/BottomSheet';

// A diferencia del otro test del boundary, acá `SafeAreaProvider` NO es un
// passthrough: monta un View real, como en la app. Ese detalle es el que
// importa — un passthrough esconde justo la regresión que este archivo cubre
// (el provider aportaba un View `flex:1` alrededor del contenido, que llenaba
// el contenedor y mandaba el BottomSheet arriba de todo en vez de anclarlo
// abajo).
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

// El provider de la raíz de la app sí envuelve todo a propósito; el del
// boundary es el que se monta como capa absoluta adentro del Modal.
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
    // Cualquier View con `flex: 1` entre el contenedor (flex:1 + flex-end) y la
    // hoja llena el contenedor y despega la hoja del borde inferior — que es
    // exactamente cómo se rompió: la hoja terminaba arriba, bajo el notch.
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
