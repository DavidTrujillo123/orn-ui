/**
 * Cada color es `string`, no un literal (`as const`): light y dark tienen
 * valores distintos para la misma clave, y createTheme() debe poder
 * aceptar cualquier hex/rgba en los overrides — literal typing lo impediría.
 *
 * Cada acento viene en cuatro roles, y no son intercambiables:
 *
 *   `primary`      relleno sólido (fondo de botón, día seleccionado, FAB).
 *   `onPrimary`    texto/ícono *encima* de ese relleno.
 *   `primarySoft`  fondo teñido para estados seleccionados y pills.
 *   `primaryText`  texto/ícono del acento sobre `surface`, `background`
 *                  o sobre su propio `primarySoft`.
 *
 * El motivo es el contraste: un acento que se lee bien como relleno no se
 * lee como texto. Antes los componentes usaban `colors.primary` para las dos
 * cosas y lo teñían concatenando alpha al hex (`colors.primary + '15'`), lo
 * que en dark daba 2.6:1 sobre la superficie — muy por debajo del 4.5:1 de
 * WCAG AA. Todos los pares de esta paleta pasan AA en ambos esquemas.
 */
export interface ThemeColors {
  primary: string;
  onPrimary: string;
  primarySoft: string;
  primaryText: string;

  secondary: string;
  onSecondary: string;
  secondarySoft: string;
  secondaryText: string;

  success: string;
  onSuccess: string;
  successSoft: string;
  successText: string;

  error: string;
  onError: string;
  errorSoft: string;
  errorText: string;

  warning: string;
  onWarning: string;
  warningSoft: string;
  warningText: string;

  white: string;
  black: string;
  background: string;
  surface: string;
  text: string;
  textLight: string;
  border: string;
  inputBackground: string;
  overlay: string;
  /** Velo semitransparente sobre contenido propio (footer de carga de List). */
  scrim: string;
  /** Fondo de placeholder mientras carga una imagen. */
  skeleton: string;
}

const neutral = {
  white: '#ffffff',
  black: '#000000',
};

export const lightPalette: ThemeColors = {
  ...neutral,

  primary: '#004cef',
  onPrimary: '#ffffff',
  primarySoft: '#e6edfe',
  primaryText: '#00369f',

  secondary: '#00cae1',
  onSecondary: '#00363d',
  secondarySoft: '#dcf6f9',
  secondaryText: '#00707d',

  success: '#34c759',
  onSuccess: '#00320f',
  successSoft: '#e3f6e9',
  successText: '#116a30',

  error: '#ff3b30',
  onError: '#3d0300',
  errorSoft: '#fdeaea',
  errorText: '#c62222',

  warning: '#f59e0b',
  onWarning: '#3d2600',
  warningSoft: '#fdf1de',
  warningText: '#8a4b00',

  background: '#f8f9fa',
  surface: '#ffffff',
  text: '#333333',
  textLight: '#666666',
  border: '#e5e7eb',
  inputBackground: '#f5f7fa',
  overlay: 'rgba(0,0,0,0.5)',
  scrim: 'rgba(248,249,250,0.8)',
  skeleton: '#eceef1',
};

/**
 * Los acentos de dark NO son los de light: sobre `#1e1e1e` hay que subir la
 * luminosidad del acento y bajar la del texto que va encima (por eso
 * `onPrimary` es azul oscuro acá y blanco en light).
 */
export const darkPalette: ThemeColors = {
  ...neutral,

  primary: '#7ba4ff',
  onPrimary: '#00205c',
  primarySoft: '#1b2740',
  primaryText: '#a9c3ff',

  secondary: '#4dd8e8',
  onSecondary: '#00363d',
  secondarySoft: '#12333a',
  secondaryText: '#7fe6f2',

  success: '#5ddb84',
  onSuccess: '#003514',
  successSoft: '#13301e',
  successText: '#7fe6a1',

  error: '#ff7b72',
  onError: '#4d0500',
  errorSoft: '#3a1c1a',
  errorText: '#ffa9a3',

  warning: '#f0b458',
  onWarning: '#3d2600',
  warningSoft: '#33260f',
  warningText: '#f5c97e',

  background: '#121212',
  surface: '#1e1e1e',
  text: '#ecedee',
  textLight: '#9ba1a6',
  border: '#2a2a2e',
  inputBackground: '#232326',
  overlay: 'rgba(0,0,0,0.6)',
  scrim: 'rgba(18,18,18,0.8)',
  skeleton: '#26262a',
};
