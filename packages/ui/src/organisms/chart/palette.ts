/**
 * Chart's categorical palette, derived from the theme.
 *
 * There is deliberately no list of colors here: if there were, a custom
 * `brand` would produce a chart that doesn't look like the rest of the app,
 * and dark mode would have to be maintained by hand. The first series reuse
 * the theme's accents (which already come with contrast resolved for their
 * scheme) and, when they run out, the primary's hue keeps rotating by the
 * golden angle: the 137.5° sequence is the one that takes longest to repeat
 * a similar hue, which is exactly what you ask of a categorical palette.
 *
 * Each color is checked against `surface` at 3:1 — the WCAG 1.4.11 minimum
 * for graphical objects, which is what a bar is — and lightened or darkened
 * until it meets it.
 */
import { contrast, toHex, toHsl } from '../../theme/colors';
import type { Theme } from '../../theme/types';

/** Minimum contrast of a graphical object against its background (WCAG 1.4.11). */
export const GRAPHIC_CONTRAST = 3;

const GOLDEN_ANGLE = 137.508;

/** Theme accents in order of appearance: hues well apart from one another. */
function seeds(theme: Theme): string[] {
  const { primary, secondary, warning, success, error } = theme.colors;
  return [primary, secondary, warning, success, error];
}

/**
 * Pushes the lightness until it stands off the background. The step is small
 * and the cap low because the goal is to correct a color, not invent another:
 * if it didn't get there in 12 tries, the best achieved is returned.
 */
function readable(hex: string, surface: string): string {
  if (contrast(hex, surface) >= GRAPHIC_CONTRAST) return hex;

  const hsl = toHsl(hex);
  // Over a light background you have to darken, over a dark one lighten.
  const direction = toHsl(surface).l > 0.5 ? -1 : 1;
  let best = hex;
  let bestContrast = contrast(hex, surface);

  for (let step = 1; step <= 12; step += 1) {
    const candidate = toHex({ ...hsl, l: Math.min(0.95, Math.max(0.08, hsl.l + direction * step * 0.05)) });
    const score = contrast(candidate, surface);
    if (score > bestContrast) {
      best = candidate;
      bestContrast = score;
    }
    if (score >= GRAPHIC_CONTRAST) return candidate;
  }
  return best;
}

function buildUnsafe(theme: Theme, count: number): string[] {
  const base = seeds(theme);
  const surface = theme.colors.surface;
  const out: string[] = [];

  for (let index = 0; index < count; index += 1) {
    if (index < base.length) {
      out.push(readable(base[index]!, surface));
      continue;
    }
    // Once past the accents, the primary's hue is rotated. `l` alternates one
    // step per turn so two neighboring hues aren't confused if the rotation
    // brings them close.
    const seed = toHsl(base[0]!);
    const turn = index - base.length + 1;
    out.push(
      readable(
        toHex({
          h: (seed.h + turn * GOLDEN_ANGLE) % 360,
          s: Math.max(0.35, seed.s),
          l: Math.min(0.78, Math.max(0.28, seed.l + (turn % 2 === 0 ? 0.08 : -0.04))),
        }),
        surface
      )
    );
  }
  return out;
}

/**
 * The color helpers speak hex. A theme with an accent in `rgba()` is legal
 * for React Native and makes `toHsl` throw: in that case it falls back to the
 * accents as they came, cycling. A chart with repeated colors is worse than
 * one with derived colors, but far better than one that doesn't render.
 */
function build(theme: Theme, count: number): string[] {
  try {
    return buildUnsafe(theme, count);
  } catch {
    const base = seeds(theme);
    return Array.from({ length: count }, (_, index) => base[index % base.length]!);
  }
}

// One palette per theme, and per theme the longest array requested so far:
// the cache is shared among all mounted charts, which is the normal case
// (a dashboard with six charts on the same theme).
const cache = new WeakMap<Theme, string[]>();

/** `count` stable colors for the series: the same index always gives the same color. */
export function seriesPalette(theme: Theme, count: number): string[] {
  const cached = cache.get(theme);
  if (cached && cached.length >= count) return cached.slice(0, count);
  const built = build(theme, Math.max(count, 8));
  cache.set(theme, built);
  return built.slice(0, count);
}
