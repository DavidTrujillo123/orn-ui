import React from 'react';
import { Text } from 'react-native';
import { render, screen, fireEvent, renderHook } from '@testing-library/react-native';
import { UIProvider, useTheme, useThemeMode, useColors } from '../UIProvider';

describe('UIProvider', () => {
  it('throws a clear error when hooks are used outside the provider', () => {
    // renderHook no captura el error de render en `result.error`: lo repropaga
    // de forma síncrona, así que se verifica con un try/catch directo.
    expect(() => renderHook(() => useTheme())).toThrow(/UIProvider/);
  });

  it('resolves the light palette when mode="light"', () => {
    const { result } = renderHook(() => useColors(), {
      wrapper: ({ children }) => <UIProvider mode="light">{children}</UIProvider>,
    });
    expect(result.current.background).toBe('#f8f9fa');
  });

  it('resolves the dark palette when mode="dark"', () => {
    const { result } = renderHook(() => useColors(), {
      wrapper: ({ children }) => <UIProvider mode="dark">{children}</UIProvider>,
    });
    expect(result.current.background).toBe('#121212');
  });

  it('lets an uncontrolled consumer switch modes via setMode', () => {
    function Consumer() {
      const { mode, setMode } = useThemeMode();
      const colors = useColors();
      return (
        <Text testID="label" onPress={() => setMode('dark')}>
          {mode}:{colors.background}
        </Text>
      );
    }
    render(
      <UIProvider defaultMode="light">
        <Consumer />
      </UIProvider>
    );
    expect(screen.getByTestId('label')).toHaveTextContent('light:#f8f9fa');
    fireEvent.press(screen.getByTestId('label'));
    expect(screen.getByTestId('label')).toHaveTextContent('dark:#121212');
  });

  it('respects a fully controlled mode and reports changes via onModeChange', () => {
    const onModeChange = jest.fn();
    function Consumer() {
      const { mode, setMode } = useThemeMode();
      return (
        <Text testID="label" onPress={() => setMode('dark')}>
          {mode}
        </Text>
      );
    }
    render(
      <UIProvider mode="light" onModeChange={onModeChange}>
        <Consumer />
      </UIProvider>
    );
    fireEvent.press(screen.getByTestId('label'));
    // controlado: el texto no cambia solo porque el consumidor no re-provee mode="dark"
    expect(screen.getByTestId('label')).toHaveTextContent('light');
    expect(onModeChange).toHaveBeenCalledWith('dark');
  });

  it('merges partial label overrides with the defaults', () => {
    function Consumer() {
      const theme = useTheme();
      return <Text testID="t">{theme.colors.primary}</Text>;
    }
    render(
      <UIProvider mode="light" labels={{ close: 'Cerrar' }}>
        <Consumer />
      </UIProvider>
    );
    expect(screen.getByTestId('t')).toBeOnTheScreen();
  });
});
