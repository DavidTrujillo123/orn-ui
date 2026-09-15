/**
 * Geometría y escalas de Chart: todo lo que se puede probar sin montar un
 * árbol vive acá, sin React y sin dependencias. marks.tsx sólo traduce estos
 * números a estilos, y Chart.tsx sólo decide qué marca dibujar.
 *
 * Convenciones:
 * - Coordenadas de React Native: origen arriba-izquierda, `y` crece hacia abajo.
 * - Ángulos en grados, 0° a las 12 en punto, creciendo en sentido horario —
 *   que es como se lee una torta y como gira `transform: rotate` en RN.
 */

export interface Point {
  x: number;
  y: number;
}

/** Fila de datos: una categoría del eje x y un número por serie. */
export type ChartRow = Record<string, string | number | null | undefined>;

/** Lee una celda como número, o null si no lo es (hueco en la serie). */
export function toNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Mata el ruido de punto flotante que deja sumar `step` en un bucle. */
function tidy(value: number): number {
  return Number(value.toFixed(10));
}

// ── escalas ────────────────────────────────────────────────────────────────

/**
 * El 1, 2, 5 o 10 (por su potencia de diez) más cercano por encima de `rough`.
 * Es lo que hace que los ticks caigan en números que alguien diría en voz
 * alta — 0, 250, 500 — y no en 0, 237, 474.
 */
export function niceStep(rough: number): number {
  if (!(rough > 0)) return 1;
  const magnitude = Math.pow(10, Math.floor(Math.log10(rough)));
  const fraction = rough / magnitude;
  const nice = fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 5 ? 5 : 10;
  return nice * magnitude;
}

export interface Ticks {
  /** Extremo inferior redondeado hacia afuera. */
  min: number;
  /** Extremo superior redondeado hacia afuera. */
  max: number;
  step: number;
  values: number[];
}

/**
 * Dominio redondeado a valores legibles más la lista de ticks. `count` es una
 * intención, no una promesa: redondear hacia afuera puede dar uno más o uno
 * menos, y eso es preferible a un eje con números arbitrarios.
 */
export function niceScale(min: number, max: number, count = 5): Ticks {
  let lo = Math.min(min, max);
  let hi = Math.max(min, max);
  if (!Number.isFinite(lo) || !Number.isFinite(hi)) {
    lo = 0;
    hi = 1;
  }
  if (lo === hi) {
    // Un solo valor no define un rango. Se le inventa uno simétrico para que
    // la marca no quede ni pegada al borde ni ocupando el alto entero.
    const pad = Math.abs(lo) || 1;
    lo -= pad;
    hi += pad;
  }
  const step = niceStep((hi - lo) / Math.max(1, count));
  const start = Math.floor(lo / step) * step;
  const end = Math.ceil(hi / step) * step;
  const values: number[] = [];
  // `end + step / 2` en vez de `end`: sumar step acumula error y el último
  // tick se perdería justo en los dominios que más se usan (0–100, 0–1).
  for (let value = start; value <= end + step / 2; value += step) values.push(tidy(value));
  return { min: start, max: end, step, values };
}

/**
 * Ticks de un dominio que el consumidor fijó a mano. No redondea nada: si
 * alguien pide 0–100, el eje dice 0–100. Es lo contrario de `niceScale`, y es
 * lo que necesita un chart en vivo — un eje que se reacomoda en cada tick hace
 * saltar la línea aunque el dato no se haya movido.
 */
export function exactTicks(min: number, max: number, count = 5): Ticks {
  const lo = Math.min(min, max);
  const hi = Math.max(min, max);
  const steps = Math.max(1, Math.floor(count));
  if (lo === hi) return { min: lo, max: hi, step: 0, values: [lo] };
  const step = (hi - lo) / steps;
  return {
    min: lo,
    max: hi,
    step,
    values: Array.from({ length: steps + 1 }, (_, index) => tidy(lo + index * step)),
  };
}

/**
 * Une dos dominios quedándose con el más ancho. Es el modo 'sticky': el eje
 * crece cuando llega un valor que no entraba y no se vuelve a achicar, así
 * que lo que se ve moverse es el dato y no la escala.
 */
export function growExtent(previous: [number, number] | null, next: [number, number]): [number, number] {
  if (!previous) return next;
  return [Math.min(previous[0], next[0]), Math.max(previous[1], next[1])];
}

/** Interpolador lineal dominio → rango. Dominio degenerado cae al medio del rango. */
export function linearScale(domain: [number, number], range: [number, number]): (value: number) => number {
  const [d0, d1] = domain;
  const [r0, r1] = range;
  const span = d1 - d0;
  if (span === 0) return () => (r0 + r1) / 2;
  return (value: number) => r0 + ((value - d0) / span) * (r1 - r0);
}

export interface ExtentOptions {
  /** Las series se suman en vez de compararse (barras/áreas apiladas). */
  stacked?: boolean;
  /** Fuerza el 0 adentro del dominio: sin él, una barra corta miente. */
  includeZero?: boolean;
}

/** Mínimo y máximo de las series pedidas. Sin datos devuelve [0, 1]. */
export function extent(rows: ChartRow[], keys: string[], options: ExtentOptions = {}): [number, number] {
  const { stacked = false, includeZero = false } = options;
  let min = Infinity;
  let max = -Infinity;

  for (const row of rows) {
    if (stacked) {
      // Positivos y negativos se apilan hacia lados opuestos del cero, así que
      // cada lado tiene su propio total y ninguno cancela al otro.
      let up = 0;
      let down = 0;
      for (const key of keys) {
        const value = toNumber(row[key]);
        if (value === null) continue;
        if (value >= 0) up += value;
        else down += value;
      }
      min = Math.min(min, down);
      max = Math.max(max, up);
    } else {
      for (const key of keys) {
        const value = toNumber(row[key]);
        if (value === null) continue;
        min = Math.min(min, value);
        max = Math.max(max, value);
      }
    }
  }

  if (min === Infinity) return [0, 1];
  if (includeZero) {
    min = Math.min(min, 0);
    max = Math.max(max, 0);
  }
  return [min, max];
}

// ── apilado ────────────────────────────────────────────────────────────────

export interface StackBand {
  key: string;
  /** Borde de la banda más cerca del cero. */
  from: number;
  /** Borde más lejos del cero. */
  to: number;
  value: number;
}

/**
 * Bandas apiladas de una fila. Los positivos crecen desde 0 hacia arriba y
 * los negativos desde 0 hacia abajo: una serie negativa no le come el alto a
 * las positivas, que es lo que pasa si se apila todo en un solo acumulador.
 */
export function stackRow(row: ChartRow, keys: string[]): StackBand[] {
  const bands: StackBand[] = [];
  let up = 0;
  let down = 0;
  for (const key of keys) {
    const value = toNumber(row[key]);
    if (value === null) continue;
    if (value >= 0) {
      bands.push({ key, from: up, to: up + value, value });
      up += value;
    } else {
      bands.push({ key, from: down, to: down + value, value });
      down += value;
    }
  }
  return bands;
}

// ── polar ──────────────────────────────────────────────────────────────────

const RAD = Math.PI / 180;

/** Punto a `radius` del centro en el ángulo dado (0° arriba, horario). */
export function polar(center: Point, radius: number, angle: number): Point {
  return {
    x: center.x + radius * Math.sin(angle * RAD),
    y: center.y - radius * Math.cos(angle * RAD),
  };
}

/** Ángulo de un punto respecto del centro, normalizado a [0, 360). */
export function angleOf(center: Point, point: Point): number {
  const degrees = Math.atan2(point.x - center.x, center.y - point.y) / RAD;
  return (degrees + 360) % 360;
}

export interface Arc {
  /** Índice de la fila que representa. */
  index: number;
  start: number;
  sweep: number;
  value: number;
  /** Proporción sobre el total, 0–1. */
  ratio: number;
}

/**
 * Arcos de una torta. Los negativos no existen en una torta (no hay "menos
 * porción"): se descartan en vez de invertirse. Total 0 ⇒ nada que dibujar.
 */
export function arcsFor(values: number[]): Arc[] {
  const safe = values.map((value) => (Number.isFinite(value) && value > 0 ? value : 0));
  const total = safe.reduce((sum, value) => sum + value, 0);
  if (total <= 0) return [];

  const arcs: Arc[] = [];
  let cursor = 0;
  safe.forEach((value, index) => {
    if (value <= 0) return;
    const sweep = (value / total) * 360;
    arcs.push({ index, start: cursor, sweep, value, ratio: value / total });
    cursor += sweep;
  });
  return arcs;
}

/** El arco que contiene ese ángulo, o -1. */
export function arcAt(arcs: Arc[], angle: number): number {
  const normalized = (angle + 360) % 360;
  for (const arc of arcs) {
    if (normalized >= arc.start && normalized < arc.start + arc.sweep) return arc.index;
  }
  return -1;
}

/** Ángulos de los ejes de un radar: el primero arriba, el resto en reparto parejo. */
export function radarAngles(count: number): number[] {
  if (count <= 0) return [];
  return Array.from({ length: count }, (_, index) => (index * 360) / count);
}

// ── segmentos y curvas ─────────────────────────────────────────────────────

export interface SegmentBox {
  left: number;
  top: number;
  width: number;
  height: number;
  /** Grados para `transform: [{ rotate }]`. */
  rotate: number;
}

/**
 * Caja de un segmento a→b: sin SVG, una línea es un rectángulo fino rotado
 * sobre su centro. Ancho = distancia, alto = grosor, rotación = la pendiente.
 */
export function segmentBox(a: Point, b: Point, thickness: number): SegmentBox {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const length = Math.hypot(dx, dy);
  return {
    left: (a.x + b.x) / 2 - length / 2,
    top: (a.y + b.y) / 2 - thickness / 2,
    width: length,
    height: thickness,
    rotate: Math.atan2(dy, dx) / RAD,
  };
}

/**
 * Suaviza una polilínea con Catmull-Rom muestreada en `steps` tramos por vano.
 * La curva pasa por todos los puntos originales (a diferencia de un Bézier de
 * control libre), así que el dato sigue siendo el dato; sólo se agrega camino
 * entre medio, y el resultado se dibuja con los mismos segmentos rectos.
 */
export function smoothPoints(points: Point[], steps = 8): Point[] {
  if (points.length < 3 || steps < 2) return points;
  const out: Point[] = [points[0]!];
  for (let i = 0; i < points.length - 1; i += 1) {
    // Los extremos se duplican para que el primer y el último vano tengan
    // las cuatro referencias que pide la spline.
    const p0 = points[i - 1] ?? points[i]!;
    const p1 = points[i]!;
    const p2 = points[i + 1]!;
    const p3 = points[i + 2] ?? p2;
    for (let s = 1; s <= steps; s += 1) {
      const t = s / steps;
      const t2 = t * t;
      const t3 = t2 * t;
      out.push({
        x: 0.5 * (2 * p1.x + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
        y: 0.5 * (2 * p1.y + (-p0.y + p2.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3),
      });
    }
  }
  return out;
}

/**
 * `y` de la polilínea en esa `x`, o null si cae fuera. Es lo que convierte una
 * línea en área: cada tira vertical pregunta su alto acá.
 */
export function sampleY(points: Point[], x: number): number | null {
  if (points.length === 0) return null;
  if (points.length === 1) return points[0]!.y;
  for (let i = 0; i < points.length - 1; i += 1) {
    const a = points[i]!;
    const b = points[i + 1]!;
    const [lo, hi] = a.x <= b.x ? [a, b] : [b, a];
    if (x < lo.x || x > hi.x) continue;
    if (hi.x === lo.x) return lo.y;
    return lo.y + ((x - lo.x) / (hi.x - lo.x)) * (hi.y - lo.y);
  }
  return null;
}

// ── formato ────────────────────────────────────────────────────────────────

const UNITS = ['', 'k', 'M', 'B'];

/**
 * Formato por defecto de ejes y tooltip: compacto, porque un eje de un chart
 * de 320px no tiene lugar para "1250000". El consumidor lo reemplaza entero
 * con `formatValue`.
 */
export function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return '';
  const sign = value < 0 ? '-' : '';
  let magnitude = Math.abs(value);
  let unit = 0;
  while (magnitude >= 1000 && unit < UNITS.length - 1) {
    magnitude /= 1000;
    unit += 1;
  }
  const decimals = magnitude < 10 && magnitude % 1 !== 0 ? 1 : 0;
  return `${sign}${magnitude.toFixed(decimals)}${UNITS[unit]}`;
}

export interface FanStrip {
  start: number;
  sweep: number;
  radius: number;
}

/**
 * Descompone un polígono alrededor de un centro en porciones angulares: es lo
 * que permite rellenar un radar con la misma primitiva que dibuja una torta.
 *
 * El corte va por el lado del polígono (parámetro `t`), no por el ángulo: el
 * radio de una cuerda no es lineal en el ángulo, y cortando por ángulo los
 * vértices quedarían redondeados justo donde el dato manda que haya una punta.
 */
export function fanStrips(center: Point, points: Point[], steps = 6): FanStrip[] {
  if (points.length < 3 || steps < 1) return [];
  const strips: FanStrip[] = [];

  for (let i = 0; i < points.length; i += 1) {
    const a = points[i]!;
    const b = points[(i + 1) % points.length]!;

    let previous = a;
    let previousAngle = angleOf(center, a);
    for (let s = 1; s <= steps; s += 1) {
      const t = s / steps;
      const point = { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
      const angle = angleOf(center, point);
      // El salto de 360 a 0 cae en algún lado del recorrido: sin esto, esa
      // porción se dibujaría girando al revés y taparía todo el resto.
      let sweep = angle - previousAngle;
      if (sweep < 0) sweep += 360;
      if (sweep > 0) {
        const radius = (Math.hypot(previous.x - center.x, previous.y - center.y) + Math.hypot(point.x - center.x, point.y - center.y)) / 2;
        // Las porciones se solapan un pelo a propósito: sin el solape, el
        // antialias deja una costura clara entre tira y tira.
        strips.push({ start: previousAngle, sweep: sweep + 0.4, radius });
      }
      previous = point;
      previousAngle = angle;
    }
  }
  return strips;
}

// ── diezmado ───────────────────────────────────────────────────────────────

/**
 * LTTB (Largest-Triangle-Three-Buckets): elige `threshold` puntos de `values`
 * quedándose con la forma de la curva. Devuelve índices, no puntos, para que
 * quien llama pueda conservar la fila entera —todas sus series— y no sólo la
 * que se usó para decidir.
 *
 * Por qué no un muestreo cada N: cada N se come los picos, que son justo lo
 * que alguien mira en una serie temporal. LTTB parte el recorrido en baldes y
 * de cada uno se queda con el punto que forma el triángulo más grande con el
 * ya elegido y con el promedio del balde siguiente — o sea, con el que más
 * cambia la silueta. Primero y último se conservan siempre.
 *
 * `x` es el índice: las categorías de un chart están repartidas parejo sobre
 * el eje, así que la distancia horizontal entre dos puntos es su distancia de
 * índice.
 */
export function lttbIndices(values: (number | null)[], threshold: number): number[] {
  const total = values.length;
  if (threshold >= total || threshold < 3) return values.map((_, index) => index);

  const at = (index: number) => values[index] ?? 0;
  const selected = [0];
  // Un balde por punto intermedio: el primero y el último no se sortean. Con
  // `threshold < total` el balde mide más de un punto, así que ninguno queda
  // vacío y salen exactamente `threshold` índices, sin repetidos.
  const every = (total - 2) / (threshold - 2);
  let previous = 0;

  for (let bucket = 0; bucket < threshold - 2; bucket += 1) {
    // Promedio del balde *siguiente*: el tercer vértice del triángulo. Va
    // corrido un balde respecto de los candidatos, y ese corrimiento es el
    // algoritmo — comparar contra el propio balde no mira hacia adelante.
    const avgStart = Math.floor((bucket + 1) * every) + 1;
    const avgEnd = Math.min(Math.floor((bucket + 2) * every) + 1, total);
    let avgX = 0;
    let avgY = 0;
    for (let i = avgStart; i < avgEnd; i += 1) {
      avgX += i;
      avgY += at(i);
    }
    const span = Math.max(1, avgEnd - avgStart);
    avgX /= span;
    avgY /= span;

    const start = Math.floor(bucket * every) + 1;
    const end = Math.floor((bucket + 1) * every) + 1;
    let best = start;
    let bestArea = -1;
    for (let i = start; i < end; i += 1) {
      const area = Math.abs(
        (previous - avgX) * (at(i) - at(previous)) - (previous - i) * (avgY - at(previous))
      );
      if (area > bestArea) {
        bestArea = area;
        best = i;
      }
    }
    selected.push(best);
    previous = best;
  }

  selected.push(total - 1);
  return selected;
}
