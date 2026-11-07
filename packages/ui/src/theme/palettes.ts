/**
 * Each color is a `string`, not a literal (`as const`): light and dark have
 * different values for the same key, and createTheme() must be able to
 * accept any hex/rgba in the overrides — literal typing would prevent it.
 *
 * Each accent comes in four roles, and they are not interchangeable:
 *
 *   `primary`      solid fill (button background, selected day, FAB).
 *   `onPrimary`    text/icon *on top of* that fill.
 *   `primarySoft`  tinted background for selected states and pills.
 *   `primaryText`  accent text/icon over `surface`, `background`
 *                  or over its own `primarySoft`.
 *
 * The reason is contrast: an accent that reads well as a fill doesn't read
 * as text. Components used to use `colors.primary` for both things and tinted
 * it by appending alpha to the hex (`colors.primary + '15'`), which in dark
 * gave 2.6:1 over the surface — well below WCAG AA's 4.5:1. Every pair in
 * this palette passes AA in both schemes.
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
  /** Semi-transparent veil over custom content (List's loading footer). */
  scrim: string;
  /** Placeholder background while an image loads. */
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

  // Red goes with white text, which is what people expect from a destructive
  // button. #ff3b30 doesn't reach 4.5:1 with white and forced near-black text
  // over red; this shade does, and still reads as an alert red.
  error: '#dc2626',
  onError: '#ffffff',
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
  skeleton: '#e3e5e8',
};

/**
 * The dark accents are NOT the light ones: over `#1e1e1e` the accent's
 * lightness has to go up and that of the text on top has to go down (which
 * is why `onPrimary` is dark blue here and white in light).
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
  border: '#3a3a40',
  inputBackground: '#232326',
  overlay: 'rgba(0,0,0,0.6)',
  scrim: 'rgba(18,18,18,0.8)',
  skeleton: '#2c2c30',
};
