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

export interface ThemeOverrides {
  colors?: {
    light?: Partial<ThemeColors>;
    dark?: Partial<ThemeColors>;
  };
  tokens?: DeepPartial<Tokens>;
}
