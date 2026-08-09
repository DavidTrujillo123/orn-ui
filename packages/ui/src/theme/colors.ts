/**
 * Utilidades de color sin dependencias, usadas para derivar una familia de
 * roles (relleno / encima / tenue / legible) a partir de un solo hex de marca.
 */

/** Contraste mínimo AA para texto normal. */
export const AA_CONTRAST = 4.5;

export interface Rgb {
  r: number;
  g: number;
  b: number;
}

export interface Hsl {
  h: number;
  s: number;
  l: number;
}

/** Roles que necesita un acento del theme, en un esquema concreto. */
export interface AccentRoles {
  /** Relleno pleno: fondo de botón, círculo del paso actual. */
  base: string;
  /** Texto/ícono que va encima del relleno. */
  on: string;
  /** Fondo tenue: badges, pill del indicador activo. */
  soft: string;
  /** El acento legible sobre `surface`: labels, links. */
  text: string;
}

const HEX = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i;

export function hexToRgb(hex: string): Rgb {
  const match = HEX.exec(hex.trim());
  if (!match) {
    throw new Error(`orn-ui: se esperaba un color hex como "#7c3aed", se recibió "${hex}".`);
  }
  const digits = match[1]!;
  const full = digits.length === 3 ? digits.replace(/./g, (c) => c + c) : digits;
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  };
}

const toHexPair = (value: number) => Math.round(clamp(value, 0, 255)).toString(16).padStart(2, '0');

export function rgbToHex({ r, g, b }: Rgb): string {
  return `#${toHexPair(r)}${toHexPair(g)}${toHexPair(b)}`;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function rgbToHsl({ r, g, b }: Rgb): Hsl {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const delta = max - min;
  const l = (max + min) / 2;

  if (delta === 0) return { h: 0, s: 0, l };

  const s = delta / (1 - Math.abs(2 * l - 1));
  let h: number;
  if (max === rn) h = ((gn - bn) / delta) % 6;
  else if (max === gn) h = (bn - rn) / delta + 2;
  else h = (rn - gn) / delta + 4;

  h *= 60;
  return { h: h < 0 ? h + 360 : h, s, l };
}

export function hslToRgb({ h, s, l }: Hsl): Rgb {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hp = (((h % 360) + 360) % 360) / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  const [r1, g1, b1] =
    hp < 1 ? [c, x, 0] : hp < 2 ? [x, c, 0] : hp < 3 ? [0, c, x] : hp < 4 ? [0, x, c] : hp < 5 ? [x, 0, c] : [c, 0, x];
  const m = l - c / 2;
  return { r: (r1 + m) * 255, g: (g1 + m) * 255, b: (b1 + m) * 255 };
}

export function toHsl(hex: string): Hsl {
  return rgbToHsl(hexToRgb(hex));
}

export function toHex(hsl: Hsl): string {
  return rgbToHex(hslToRgb({ ...hsl, s: clamp(hsl.s, 0, 1), l: clamp(hsl.l, 0, 1) }));
}

function channelLuminance(value: number) {
  const c = value / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

/** Luminancia relativa WCAG de un hex. */
export function luminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  return 0.2126 * channelLuminance(r) + 0.7152 * channelLuminance(g) + 0.0722 * channelLuminance(b);
}

/** Ratio de contraste WCAG entre dos hex: 1 (igual) a 21 (blanco sobre negro). */
export function contrast(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/**
 * Blanco si alcanza el contraste AA —es lo que se espera encima de un relleno
 * de color— y si no, el extremo que más contraste dé.
 */
function bestOnColor(background: string, light: string, dark: string): string {
  if (contrast(background, light) >= AA_CONTRAST) return light;
  return contrast(background, dark) >= contrast(background, light) ? dark : light;
}

/**
 * Mueve la luminosidad del tono hasta alcanzar el contraste pedido contra
 * `against`. Si ni el extremo llega —un amarillo puro sobre blanco, por
 * ejemplo— devuelve el más contrastado que encontró en el camino.
 */
function reachContrast(hsl: Hsl, against: string, target: number, direction: 'darker' | 'lighter'): string {
  const step = direction === 'darker' ? -0.02 : 0.02;
  let best = toHex(hsl);
  let bestRatio = contrast(best, against);

  for (let l = hsl.l; l >= 0 && l <= 1; l += step) {
    const candidate = toHex({ ...hsl, l });
    const ratio = contrast(candidate, against);
    if (ratio > bestRatio) {
      best = candidate;
      bestRatio = ratio;
    }
    if (ratio >= target) return candidate;
  }

  return best;
}

/**
 * Deriva los cuatro roles de un acento a partir de un hex, para un esquema.
 * `surface` es el fondo sobre el que tiene que leerse el rol `text`, así que
 * cada esquema pasa el suyo.
 */
export function deriveAccent(hex: string, scheme: 'light' | 'dark', surface: string): AccentRoles {
  const hsl = toHsl(hex);

  if (scheme === 'light') {
    const base = toHex(hsl);
    return {
      base,
      on: bestOnColor(base, '#ffffff', '#1a1a1a'),
      soft: toHex({ h: hsl.h, s: Math.min(hsl.s, 0.85), l: 0.94 }),
      text: reachContrast({ ...hsl, l: Math.min(hsl.l, 0.38) }, surface, AA_CONTRAST, 'darker'),
    };
  }

  // En oscuro el acento sube de luminosidad y lo que va encima baja: un
  // #004cef sobre #1e1e1e no se distingue del fondo.
  const base = toHex({ ...hsl, l: 0.72 });
  return {
    base,
    on: bestOnColor(base, '#ffffff', toHex({ ...hsl, s: Math.min(hsl.s, 0.9), l: 0.16 })),
    soft: toHex({ h: hsl.h, s: Math.min(hsl.s, 0.35), l: 0.18 }),
    text: reachContrast({ ...hsl, l: Math.max(hsl.l, 0.74) }, surface, AA_CONTRAST, 'lighter'),
  };
}
