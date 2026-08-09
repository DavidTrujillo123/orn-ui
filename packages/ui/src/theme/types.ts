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
   * Un hex por acento; de cada uno se derivan sus cuatro roles (relleno, lo
   * que va encima, el fondo tenue y la variante legible sobre `surface`) para
   * light y para dark, con el contraste ya resuelto. Un string suelto define
   * `primary`. Lo que se pase en `colors` gana sobre lo derivado.
   */
  brand?: string | Partial<Record<BrandAccent, string>>;
  colors?: {
    light?: Partial<ThemeColors>;
    dark?: Partial<ThemeColors>;
  };
  tokens?: DeepPartial<Tokens>;
}
