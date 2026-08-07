/**
 * Cada color es `string`, no un literal (`as const`): light y dark tienen
 * valores distintos para la misma clave, y createTheme() debe poder
 * aceptar cualquier hex/rgba en los overrides — literal typing lo impediría.
 */
export interface ThemeColors {
  primary: string;
  secondary: string;
  white: string;
  black: string;
  error: string;
  success: string;
  warning: string;
  background: string;
  surface: string;
  text: string;
  textLight: string;
  border: string;
  inputBackground: string;
  overlay: string;
}

const shared = {
  primary: '#004cef',
  secondary: '#00cae1',
  white: '#ffffff',
  black: '#000000',
  error: '#ff3b30',
  success: '#34c759',
  warning: '#f59e0b',
};

export const lightPalette: ThemeColors = {
  ...shared,
  background: '#f8f9fa',
  surface: '#ffffff',
  text: '#333333',
  textLight: '#666666',
  border: '#e5e7eb',
  inputBackground: '#f5f7fa',
  overlay: 'rgba(0,0,0,0.5)',
};

export const darkPalette: ThemeColors = {
  ...shared,
  background: '#121212',
  surface: '#1e1e1e',
  text: '#ecedee',
  textLight: '#9ba1a6',
  border: '#2a2a2e',
  inputBackground: '#232326',
  overlay: 'rgba(0,0,0,0.6)',
};
