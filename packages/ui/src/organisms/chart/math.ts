/**
 * Chart geometry and scales: everything that can be tested without mounting a
 * tree lives here, without React and without dependencies. marks.tsx only
 * translates these numbers into styles, and Chart.tsx only decides which mark to draw.
 *
 * Conventions:
 * - React Native coordinates: origin at the top-left, `y` grows downward.
 * - Angles in degrees, 0° at 12 o'clock, increasing clockwise —
 *   which is how a pie is read and how `transform: rotate` turns in RN.
 */

export interface Point {
  x: number;
  y: number;
}

/** Data row: an x-axis category and one number per series. */
export type ChartRow = Record<string, string | number | null | undefined>;

/** Reads a cell as a number, or null if it isn't one (a gap in the series). */
export function toNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Kills the floating point noise left by adding `step` in a loop. */
function tidy(value: number): number {
  return Number(value.toFixed(10));
}

// ── scales ─────────────────────────────────────────────────────────────────

/**
 * The 1, 2, 5 or 10 (times its power of ten) closest above `rough`.
 * It is what makes ticks land on numbers someone would say out loud —
 * 0, 250, 500 — and not on 0, 237, 474.
 */
export function niceStep(rough: number): number {
  if (!(rough > 0)) return 1;
  const magnitude = Math.pow(10, Math.floor(Math.log10(rough)));
  const fraction = rough / magnitude;
  const nice = fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 5 ? 5 : 10;
  return nice * magnitude;
}

export interface Ticks {
  /** Lower end, rounded outward. */
  min: number;
  /** Upper end, rounded outward. */
  max: number;
  step: number;
  values: number[];
}

/**
 * Domain rounded to legible values plus the list of ticks. `count` is an
 * intent, not a promise: rounding outward may give one more or one fewer,
 * and that is preferable to an axis with arbitrary numbers.
 */
export function niceScale(min: number, max: number, count = 5): Ticks {
  let lo = Math.min(min, max);
  let hi = Math.max(min, max);
  if (!Number.isFinite(lo) || !Number.isFinite(hi)) {
    lo = 0;
    hi = 1;
  }
  if (lo === hi) {
    // A single value doesn't define a range. A symmetric one is made up so
    // the mark neither sticks to the edge nor fills the whole height.
    const pad = Math.abs(lo) || 1;
    lo -= pad;
    hi += pad;
  }
  const step = niceStep((hi - lo) / Math.max(1, count));
  const start = Math.floor(lo / step) * step;
  const end = Math.ceil(hi / step) * step;
  const values: number[] = [];
  // `end + step / 2` instead of `end`: adding step accumulates error and the
  // last tick would be lost precisely in the most used domains (0–100, 0–1).
  for (let value = start; value <= end + step / 2; value += step) values.push(tidy(value));
  return { min: start, max: end, step, values };
}

/**
 * Ticks for a domain the consumer set by hand. It rounds nothing: if someone
 * asks for 0–100, the axis says 0–100. It is the opposite of `niceScale`, and
 * it is what a live chart needs — an axis that rearranges itself on every tick
 * makes the line jump even though the data hasn't moved.
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
 * Merges two domains keeping the widest. It is the 'sticky' mode: the axis
 * grows when a value arrives that didn't fit and never shrinks back, so what
 * you see moving is the data and not the scale.
 */
export function growExtent(previous: [number, number] | null, next: [number, number]): [number, number] {
  if (!previous) return next;
  return [Math.min(previous[0], next[0]), Math.max(previous[1], next[1])];
}

/** Linear domain → range interpolator. A degenerate domain falls to the middle of the range. */
export function linearScale(domain: [number, number], range: [number, number]): (value: number) => number {
  const [d0, d1] = domain;
  const [r0, r1] = range;
  const span = d1 - d0;
  if (span === 0) return () => (r0 + r1) / 2;
  return (value: number) => r0 + ((value - d0) / span) * (r1 - r0);
}

export interface ExtentOptions {
  /** The series are summed instead of compared (stacked bars/areas). */
  stacked?: boolean;
  /** Forces 0 into the domain: without it, a short bar lies. */
  includeZero?: boolean;
}

/** Minimum and maximum of the requested series. With no data it returns [0, 1]. */
export function extent(rows: ChartRow[], keys: string[], options: ExtentOptions = {}): [number, number] {
  const { stacked = false, includeZero = false } = options;
  let min = Infinity;
  let max = -Infinity;

  for (const row of rows) {
    if (stacked) {
      // Positives and negatives stack toward opposite sides of zero, so each
      // side has its own total and neither cancels the other.
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

// ── stacking ───────────────────────────────────────────────────────────────

export interface StackBand {
  key: string;
  /** Edge of the band closest to zero. */
  from: number;
  /** Edge furthest from zero. */
  to: number;
  value: number;
}

/**
 * Stacked bands of a row. Positives grow from 0 upward and negatives from 0
 * downward: a negative series doesn't eat the positives' height, which is
 * what happens if everything is stacked in a single accumulator.
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

/** Point at `radius` from the center at the given angle (0° up, clockwise). */
export function polar(center: Point, radius: number, angle: number): Point {
  return {
    x: center.x + radius * Math.sin(angle * RAD),
    y: center.y - radius * Math.cos(angle * RAD),
  };
}

/** Angle of a point relative to the center, normalized to [0, 360). */
export function angleOf(center: Point, point: Point): number {
  const degrees = Math.atan2(point.x - center.x, center.y - point.y) / RAD;
  return (degrees + 360) % 360;
}

export interface Arc {
  /** Index of the row it represents. */
  index: number;
  start: number;
  sweep: number;
  value: number;
  /** Share of the total, 0–1. */
  ratio: number;
}

/**
 * Arcs of a pie. Negatives don't exist in a pie (there is no "less slice"):
 * they are dropped instead of inverted. Total 0 ⇒ nothing to draw.
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

/** The arc containing that angle, or -1. */
export function arcAt(arcs: Arc[], angle: number): number {
  const normalized = (angle + 360) % 360;
  for (const arc of arcs) {
    if (normalized >= arc.start && normalized < arc.start + arc.sweep) return arc.index;
  }
  return -1;
}

/** Angles of a radar's axes: the first at the top, the rest evenly spread. */
export function radarAngles(count: number): number[] {
  if (count <= 0) return [];
  return Array.from({ length: count }, (_, index) => (index * 360) / count);
}

// ── segments and curves ────────────────────────────────────────────────────

export interface SegmentBox {
  left: number;
  top: number;
  width: number;
  height: number;
  /** Degrees for `transform: [{ rotate }]`. */
  rotate: number;
}

/**
 * Box of a segment a→b: without SVG, a line is a thin rectangle rotated
 * around its center. Width = distance, height = thickness, rotation = the slope.
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
 * Smooths a polyline with Catmull-Rom sampled in `steps` segments per span.
 * The curve passes through all the original points (unlike a free-control
 * Bézier), so the data is still the data; only path is added in between, and
 * the result is drawn with the same straight segments.
 */
export function smoothPoints(points: Point[], steps = 8): Point[] {
  if (points.length < 3 || steps < 2) return points;
  const out: Point[] = [points[0]!];
  for (let i = 0; i < points.length - 1; i += 1) {
    // The endpoints are duplicated so the first and last spans have the
    // four references the spline asks for.
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
 * The polyline's `y` at that `x`, or null if it falls outside. It is what
 * turns a line into an area: each vertical strip asks for its height here.
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

// ── formatting ─────────────────────────────────────────────────────────────

const UNITS = ['', 'k', 'M', 'B'];

/**
 * Default format for axes and tooltip: compact, because the axis of a 320px
 * chart has no room for "1250000". The consumer replaces it entirely with
 * `formatValue`.
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
 * Breaks a polygon around a center into angular slices: it is what lets a
 * radar be filled with the same primitive that draws a pie.
 *
 * The cut goes along the polygon's side (parameter `t`), not by angle: the
 * radius of a chord isn't linear in the angle, and cutting by angle would
 * round off the vertices exactly where the data says there should be a point.
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
      // The jump from 360 to 0 falls somewhere along the path: without this,
      // that slice would be drawn turning backwards and cover everything else.
      let sweep = angle - previousAngle;
      if (sweep < 0) sweep += 360;
      if (sweep > 0) {
        const radius = (Math.hypot(previous.x - center.x, previous.y - center.y) + Math.hypot(point.x - center.x, point.y - center.y)) / 2;
        // The slices overlap a hair on purpose: without the overlap, the
        // antialias leaves a light seam between strips.
        strips.push({ start: previousAngle, sweep: sweep + 0.4, radius });
      }
      previous = point;
      previousAngle = angle;
    }
  }
  return strips;
}

// ── decimation ─────────────────────────────────────────────────────────────

/**
 * LTTB (Largest-Triangle-Three-Buckets): picks `threshold` points from
 * `values` while keeping the shape of the curve. Returns indexes, not points,
 * so the caller can keep the whole row —all its series— and not only the one
 * used to decide.
 *
 * Why not sample every N: every N eats the peaks, which are exactly what
 * someone looks at in a time series. LTTB splits the path into buckets and
 * from each one keeps the point that forms the largest triangle with the one
 * already picked and with the average of the next bucket — that is, the one
 * that changes the silhouette the most. First and last are always kept.
 *
 * `x` is the index: a chart's categories are spread evenly along the axis, so
 * the horizontal distance between two points is their index distance.
 */
export function lttbIndices(values: (number | null)[], threshold: number): number[] {
  const total = values.length;
  if (threshold >= total || threshold < 3) return values.map((_, index) => index);

  const at = (index: number) => values[index] ?? 0;
  const selected = [0];
  // One bucket per intermediate point: the first and the last aren't drawn.
  // With `threshold < total` a bucket spans more than one point, so none is
  // empty and exactly `threshold` indexes come out, with no repeats.
  const every = (total - 2) / (threshold - 2);
  let previous = 0;

  for (let bucket = 0; bucket < threshold - 2; bucket += 1) {
    // Average of the *next* bucket: the triangle's third vertex. It is
    // offset one bucket from the candidates, and that offset is the
    // algorithm — comparing against the bucket itself doesn't look ahead.
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
