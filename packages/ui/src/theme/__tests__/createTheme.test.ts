import { createTheme, defaultTheme } from '../createTheme';
import { lightPalette } from '../palettes';

describe('createTheme', () => {
  it('returns the default palette when called with no overrides', () => {
    const { light, dark } = createTheme();
    expect(light.colors.primary).toBe(lightPalette.primary);
    expect(light.scheme).toBe('light');
    expect(dark.scheme).toBe('dark');
  });

  it('deep-merges color overrides without touching untouched keys', () => {
    const { light } = createTheme({ colors: { light: { primary: '#ff0000' } } });
    expect(light.colors.primary).toBe('#ff0000');
    expect(light.colors.secondary).toBe(lightPalette.secondary);
  });

  it('deep-merges token overrides without touching sibling tokens', () => {
    const { light } = createTheme({ tokens: { radius: { md: 999 } } });
    expect(light.tokens.radius.md).toBe(999);
    expect(light.tokens.radius.lg).toBe(defaultTheme.light.tokens.radius.lg);
    expect(light.tokens.spacing).toEqual(defaultTheme.light.tokens.spacing);
  });

  it('never mutates the shared defaults', () => {
    const before = { ...defaultTheme.light.colors };
    createTheme({ colors: { light: { primary: '#123456' } } });
    expect(defaultTheme.light.colors).toEqual(before);
  });

  it('light and dark share the same tokens object reference when unmodified', () => {
    const { light, dark } = createTheme();
    expect(light.tokens).toBe(dark.tokens);
  });
});
