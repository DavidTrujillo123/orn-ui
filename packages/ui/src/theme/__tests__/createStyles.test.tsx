import React from 'react';
import { renderHook } from '@testing-library/react-native';
import { createStyles } from '../createStyles';
import { UIProvider } from '../UIProvider';
import { createTheme } from '../createTheme';

const useStyles = createStyles((theme) => ({
  box: { backgroundColor: theme.colors.surface, padding: theme.tokens.spacing.md },
}));

function wrapper(theme = createTheme()) {
  return ({ children }: { children: React.ReactNode }) => (
    <UIProvider theme={theme} mode="light">
      {children}
    </UIProvider>
  );
}

describe('createStyles', () => {
  it('returns the same style object across renders for the same theme', () => {
    const { result, rerender } = renderHook(() => useStyles(), { wrapper: wrapper() });
    const first = result.current;
    rerender({});
    expect(result.current).toBe(first);
  });

  it('returns the same style object across two independent hook instances sharing a theme', () => {
    const theme = createTheme();
    const { result: a } = renderHook(() => useStyles(), { wrapper: wrapper(theme) });
    const { result: b } = renderHook(() => useStyles(), { wrapper: wrapper(theme) });
    expect(a.current).toBe(b.current);
  });

  it('returns a different style object for a different theme', () => {
    const themeA = createTheme({ colors: { light: { surface: '#111111' } } });
    const themeB = createTheme({ colors: { light: { surface: '#222222' } } });
    const { result: a } = renderHook(() => useStyles(), { wrapper: wrapper(themeA) });
    const { result: b } = renderHook(() => useStyles(), { wrapper: wrapper(themeB) });
    expect(a.current).not.toBe(b.current);
  });

  it('resolves token values into the produced stylesheet', () => {
    const theme = createTheme();
    const { result } = renderHook(() => useStyles(), { wrapper: wrapper(theme) });
    const flattenedPadding = (result.current.box as any).padding;
    expect(flattenedPadding).toBe(theme.light.tokens.spacing.md);
  });
});
