/**
 * Paleta categórica de Chart, derivada del theme.
 *
 * No hay una lista de colores acá a propósito: si la hubiera, un `brand`
 * personalizado daría un chart que no se parece al resto de la app, y el modo
 * oscuro tendría que mantenerse a mano. Las primeras series reusan los acentos
 * del theme (que ya vienen con el contraste resuelto para su scheme) y, cuando
 * se acaban, se sigue rotando el tono del primario por el ángulo áureo: la
 * secuencia 137.5° es la que más tarda en repetir un tono parecido, que es
 * exactamente lo que se le pide a una paleta categórica.
 *
 * Cada color se verifica contra `surface` a 3:1 — el mínimo de WCAG 1.4.11
 * para objetos gráficos, que es lo que es una barra — y se aclara u oscurece
 * hasta cumplirlo.
 */
import { contrast, toHex, toHsl } from '../../theme/colors';
import type { Theme } from '../../theme/types';

/** Contraste mínimo de un objeto gráfico contra su fondo (WCAG 1.4.11). */
export const GRAPHIC_CONTRAST = 3;

const GOLDEN_ANGLE = 137.508;

/** Acentos del theme en orden de aparición: tonos bien separados entre sí. */
function seeds(theme: Theme): string[] {
  const { primary, secondary, warning, success, error } = theme.colors;
  return [primary, secondary, warning, success, error];
}

/**
 * Empuja la luminosidad hasta despegar del fondo. El paso es chico y el tope
 * bajo porque el objetivo es corregir un color, no inventar otro: si en 12
 * intentos no llegó, se devuelve lo mejor que se consiguió.
 */
function readable(hex: string, surface: string): string {
  if (contrast(hex, surface) >= GRAPHIC_CONTRAST) return hex;

  const hsl = toHsl(hex);
  // Sobre un fondo claro hay que oscurecer, sobre uno oscuro aclarar.
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
    // Pasados los acentos, se gira el tono del primario. `l` alterna un
    // escalón por vuelta para que dos tonos vecinos no se confundan si la
    // rotación los acerca.
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
 * Los helpers de color hablan hex. Un theme con un acento en `rgba()` es
 * legal para React Native y hace que `toHsl` tire: en ese caso se cae a los
 * acentos tal cual vinieron, ciclando. Un chart con colores repetidos es peor
 * que uno con colores derivados, pero muchísimo mejor que uno que no renderiza.
 */
function build(theme: Theme, count: number): string[] {
  try {
    return buildUnsafe(theme, count);
  } catch {
    const base = seeds(theme);
    return Array.from({ length: count }, (_, index) => base[index % base.length]!);
  }
}

// Una paleta por theme, y por theme el arreglo más largo pedido hasta ahora:
// la cache se comparte entre todos los charts montados, que es el caso normal
// (un dashboard con seis charts sobre el mismo theme).
const cache = new WeakMap<Theme, string[]>();

/** `count` colores estables para las series: el mismo índice da siempre el mismo color. */
export function seriesPalette(theme: Theme, count: number): string[] {
  const cached = cache.get(theme);
  if (cached && cached.length >= count) return cached.slice(0, count);
  const built = build(theme, Math.max(count, 8));
  cache.set(theme, built);
  return built.slice(0, count);
}
