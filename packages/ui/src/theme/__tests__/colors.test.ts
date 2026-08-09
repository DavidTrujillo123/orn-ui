import { AA_CONTRAST, contrast, deriveAccent, hexToRgb, rgbToHex, toHex, toHsl } from '../colors';
import { createTheme } from '../createTheme';
import { darkPalette, lightPalette } from '../palettes';

const BRANDS = ['#004cef', '#7c3aed', '#e11d48', '#059669', '#f59e0b', '#0ea5e9', '#111111', '#facc15'];

describe('color utils', () => {
  it('reads 3 and 6 digit hex', () => {
    expect(hexToRgb('#fff')).toEqual({ r: 255, g: 255, b: 255 });
    expect(hexToRgb('7c3aed')).toEqual({ r: 124, g: 58, b: 237 });
  });

  it('rejects anything that is not a hex, naming what it got', () => {
    expect(() => hexToRgb('rebeccapurple')).toThrow(/rebeccapurple/);
  });

  it('survives the hex → hsl → hex round trip', () => {
    for (const hex of BRANDS) {
      expect(toHex(toHsl(hex))).toBe(hex.toLowerCase());
    }
  });

  it('rounds channels back into a valid hex', () => {
    expect(rgbToHex({ r: 300, g: -5, b: 127.6 })).toBe('#ff0080');
  });

  it('measures the reference contrasts', () => {
    expect(contrast('#ffffff', '#000000')).toBeCloseTo(21, 1);
    expect(contrast('#ffffff', '#ffffff')).toBeCloseTo(1, 5);
  });
});

describe('deriveAccent', () => {
  it.each(BRANDS)('%s stays legible in light: text over surface and `on` over the fill', (hex) => {
    const roles = deriveAccent(hex, 'light', lightPalette.surface);
    expect(contrast(roles.text, lightPalette.surface)).toBeGreaterThanOrEqual(AA_CONTRAST);
    expect(contrast(roles.on, roles.base)).toBeGreaterThanOrEqual(AA_CONTRAST);
  });

  it.each(BRANDS)('%s stays legible in dark', (hex) => {
    const roles = deriveAccent(hex, 'dark', darkPalette.surface);
    expect(contrast(roles.text, darkPalette.surface)).toBeGreaterThanOrEqual(AA_CONTRAST);
    expect(contrast(roles.on, roles.base)).toBeGreaterThanOrEqual(AA_CONTRAST);
  });

  it('the soft role stays a tint of the brand: pale in light, deep in dark', () => {
    const light = deriveAccent('#7c3aed', 'light', lightPalette.surface);
    const dark = deriveAccent('#7c3aed', 'dark', darkPalette.surface);
    expect(toHsl(light.soft).l).toBeGreaterThan(0.9);
    expect(toHsl(dark.soft).l).toBeLessThan(0.25);
    expect(Math.round(toHsl(light.soft).h)).toBe(Math.round(toHsl('#7c3aed').h));
  });
});

describe('createTheme({ brand })', () => {
  it('one hex fills the whole primary family, in both schemes', () => {
    const { light, dark } = createTheme({ brand: { primary: '#7c3aed' } });

    expect(light.colors.primary).toBe('#7c3aed');
    expect(light.colors.primarySoft).not.toBe(lightPalette.primarySoft);
    expect(light.colors.primaryText).not.toBe(lightPalette.primaryText);
    expect(dark.colors.primary).not.toBe(darkPalette.primary);
    expect(dark.colors.onPrimary).not.toBe(darkPalette.onPrimary);
  });

  it('a bare string is a shorthand for primary', () => {
    expect(createTheme({ brand: '#7c3aed' }).light.colors.primary).toBe('#7c3aed');
  });

  it('leaves the accents it was not given alone', () => {
    const { light } = createTheme({ brand: { primary: '#7c3aed' } });
    expect(light.colors.success).toBe(lightPalette.success);
    expect(light.colors.errorSoft).toBe(lightPalette.errorSoft);
  });

  it('covers every brand accent', () => {
    const { light } = createTheme({
      brand: { primary: '#7c3aed', secondary: '#0ea5e9', success: '#059669', error: '#e11d48', warning: '#f59e0b' },
    });
    expect(light.colors.secondaryText).not.toBe(lightPalette.secondaryText);
    expect(light.colors.warningSoft).not.toBe(lightPalette.warningSoft);
  });

  it('an explicit role wins over the derived one', () => {
    const { dark } = createTheme({
      brand: { primary: '#7c3aed' },
      colors: { dark: { primarySoft: '#241b3a' } },
    });
    expect(dark.colors.primarySoft).toBe('#241b3a');
  });

  it('without brand the palettes are untouched', () => {
    const { light, dark } = createTheme();
    expect(light.colors).toEqual(lightPalette);
    expect(dark.colors).toEqual(darkPalette);
  });
});
