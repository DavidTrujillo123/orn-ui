import { lightPalette, darkPalette, type ThemeColors } from './palettes';
import { tokens as defaultTokens } from './tokens';
import { deriveAccent } from './colors';
import type { BrandAccent, Theme, ThemeOverrides, ThemePair } from './types';

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

const capitalize = <T extends string>(name: T) => (name.charAt(0).toUpperCase() + name.slice(1)) as Capitalize<T>;

/** Expands each `brand` hex into the accent's four roles in a scheme. */
function brandColors(
  brand: ThemeOverrides['brand'],
  scheme: 'light' | 'dark',
  palette: ThemeColors
): Partial<ThemeColors> {
  if (!brand) return {};
  const accents = typeof brand === 'string' ? { primary: brand } : brand;
  const out: Partial<ThemeColors> = {};

  for (const [name, hex] of Object.entries(accents) as [BrandAccent, string | undefined][]) {
    if (!hex) continue;
    const roles = deriveAccent(hex, scheme, palette.surface);
    out[name] = roles.base;
    out[`on${capitalize(name)}`] = roles.on;
    out[`${name}Soft`] = roles.soft;
    out[`${name}Text`] = roles.text;
  }

  return out;
}

/**
 * Builds the light/dark theme pair consumed by <UIProvider theme={...}>.
 * Never mutates the defaults: each call produces new objects, safe to share
 * between different providers (tests, multi-brand in the same tree).
 *
 * `brand` is applied before `colors`, so a hand-written role always wins
 * over the derived one.
 */
export function createTheme(overrides?: ThemeOverrides): ThemePair {
  const tokens = mergeDeep(defaultTokens, overrides?.tokens as any);

  const light: Theme = {
    colors: mergeDeep(
      mergeDeep(lightPalette, brandColors(overrides?.brand, 'light', lightPalette)),
      overrides?.colors?.light
    ),
    tokens,
    scheme: 'light',
  };

  const dark: Theme = {
    colors: mergeDeep(
      mergeDeep(darkPalette, brandColors(overrides?.brand, 'dark', darkPalette)),
      overrides?.colors?.dark
    ),
    tokens,
    scheme: 'dark',
  };

  return { light, dark };
}

export const defaultTheme: ThemePair = createTheme();
