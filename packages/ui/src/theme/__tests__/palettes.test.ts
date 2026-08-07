import { lightPalette, darkPalette, type ThemeColors } from '../palettes';

/**
 * El contraste de la paleta es una garantía de la librería, no una opinión de
 * diseño: si alguien vuelve a poner un acento pleno donde va texto, esto falla
 * antes de llegar a la app. Fórmula de luminancia relativa de WCAG 2.1.
 */
function channel(value: number): number {
  const c = value / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: string): number {
  const h = hex.replace('#', '');
  const at = (i: number) => channel(parseInt(h.slice(i, i + 2), 16));
  return 0.2126 * at(0) + 0.7152 * at(2) + 0.0722 * at(4);
}

function contrast(fg: string, bg: string): number {
  const a = luminance(fg);
  const b = luminance(bg);
  const hi = Math.max(a, b);
  const lo = Math.min(a, b);
  return (hi + 0.05) / (lo + 0.05);
}

const AA_TEXT = 4.5;

const ACCENTS = ['primary', 'secondary', 'success', 'error', 'warning'] as const;
type Accent = (typeof ACCENTS)[number];

const capitalize = (a: Accent) => (a.charAt(0).toUpperCase() + a.slice(1)) as Capitalize<Accent>;

describe.each([
  ['lightPalette', lightPalette],
  ['darkPalette', darkPalette],
])('%s', (_name, palette: ThemeColors) => {
  it.each(ACCENTS)('on%s is readable over the %s fill', (accent) => {
    const on = palette[`on${capitalize(accent)}` as keyof ThemeColors];
    expect(contrast(on, palette[accent])).toBeGreaterThanOrEqual(AA_TEXT);
  });

  it.each(ACCENTS)('%sText is readable over its own soft tint', (accent) => {
    const text = palette[`${accent}Text` as keyof ThemeColors];
    const soft = palette[`${accent}Soft` as keyof ThemeColors];
    expect(contrast(text, soft)).toBeGreaterThanOrEqual(AA_TEXT);
  });

  it.each(ACCENTS)('%sText is readable over surface and background', (accent) => {
    const text = palette[`${accent}Text` as keyof ThemeColors];
    expect(contrast(text, palette.surface)).toBeGreaterThanOrEqual(AA_TEXT);
    expect(contrast(text, palette.background)).toBeGreaterThanOrEqual(AA_TEXT);
  });

  it('keeps body and secondary text readable over surface', () => {
    expect(contrast(palette.text, palette.surface)).toBeGreaterThanOrEqual(AA_TEXT);
    expect(contrast(palette.textLight, palette.surface)).toBeGreaterThanOrEqual(AA_TEXT);
  });

  it.each(ACCENTS)('%sSoft stays a tint, not a fill', (accent) => {
    // Un "soft" que se despega demasiado de la superficie deja de leerse como
    // fondo teñido y compite con el contenido que envuelve.
    const soft = palette[`${accent}Soft` as keyof ThemeColors];
    expect(contrast(soft, palette.surface)).toBeLessThan(2);
  });
});
