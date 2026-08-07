import { lightPalette, darkPalette } from './palettes';
import { tokens as defaultTokens } from './tokens';
import type { Theme, ThemeOverrides, ThemePair } from './types';

function mergeDeep<T extends Record<string, any>>(base: T, patch?: Partial<T>): T {
  if (!patch) return base;
  const out: Record<string, any> = { ...base };
  for (const key of Object.keys(patch)) {
    const patchVal = (patch as Record<string, any>)[key];
    const baseVal = (base as Record<string, any>)[key];
    if (
      patchVal &&
      baseVal &&
      typeof patchVal === 'object' &&
      typeof baseVal === 'object' &&
      !Array.isArray(patchVal)
    ) {
      out[key] = mergeDeep(baseVal, patchVal);
    } else if (patchVal !== undefined) {
      out[key] = patchVal;
    }
  }
  return out as T;
}

/**
 * Construye el par de themes light/dark que consume <UIProvider theme={...}>.
 * Nunca muta los defaults: cada llamada produce objetos nuevos, seguros de
 * compartir entre providers distintos (tests, multi-brand en el mismo árbol).
 */
export function createTheme(overrides?: ThemeOverrides): ThemePair {
  const tokens = mergeDeep(defaultTokens, overrides?.tokens as any);

  const light: Theme = {
    colors: mergeDeep(lightPalette, overrides?.colors?.light),
    tokens,
    scheme: 'light',
  };

  const dark: Theme = {
    colors: mergeDeep(darkPalette, overrides?.colors?.dark),
    tokens,
    scheme: 'dark',
  };

  return { light, dark };
}

export const defaultTheme: ThemePair = createTheme();
