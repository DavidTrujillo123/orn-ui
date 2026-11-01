import type { Tokens } from './tokens';
import type { ThemeColors } from './palettes';

/** Theme resuelto: paleta de un scheme concreto + tokens compartidos. */
export interface Theme {
  colors: ThemeColors;
  tokens: Tokens;
  scheme: 'light' | 'dark';
}

/** Par de themes light/dark que produce createTheme() y consume UIProvider. */
export interface ThemePair {
  light: Theme;
  dark: Theme;
}

export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};

/** Acentos que se pueden definir con un solo hex vía `brand`. */
export type BrandAccent = 'primary' | 'secondary' | 'success' | 'error' | 'warning';

export interface ThemeOverrides {
  /**
   * One hex per accent; each one derives its four roles (fill, content on top,
   * subtle background and the variant legible on `surface`) for light and
   * dark, with contrast already resolved. A plain string sets `primary`.
   * Anything passed in `colors` wins over the derived values.
   */
  brand?: string | Partial<Record<BrandAccent, string>>;
  colors?: {
    light?: Partial<ThemeColors>;
    dark?: Partial<ThemeColors>;
  };
  tokens?: DeepPartial<Tokens>;
}
