import {
  angleOf,
  arcAt,
  arcsFor,
  clamp,
  exactTicks,
  extent,
  fanStrips,
  formatNumber,
  growExtent,
  linearScale,
  lttbIndices,
  niceScale,
  niceStep,
  polar,
  radarAngles,
  sampleY,
  segmentBox,
  smoothPoints,
  stackRow,
  toNumber,
  type ChartRow,
} from '../chart/math';
import { GRAPHIC_CONTRAST, seriesPalette } from '../chart/palette';
import { contrast } from '../../theme/colors';
import { createTheme } from '../../theme/createTheme';

const ROWS: ChartRow[] = [
  { x: 'Jan', sales: 10, costs: -4 },
  { x: 'Feb', sales: 30, costs: -6 },
  { x: 'Mar', sales: 20, costs: null },
];

describe('chart/math', () => {
  describe('toNumber', () => {
    it('only lets real numbers through', () => {
      expect(toNumber(3)).toBe(3);
      expect(toNumber(0)).toBe(0);
      expect(toNumber('3')).toBeNull();
      expect(toNumber(null)).toBeNull();
      expect(toNumber(undefined)).toBeNull();
      expect(toNumber(NaN)).toBeNull();
      expect(toNumber(Infinity)).toBeNull();
    });
  });

  it('clamp keeps the value inside the range', () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-1, 0, 10)).toBe(0);
    expect(clamp(11, 0, 10)).toBe(10);
  });

  describe('niceStep', () => {
    it('rounds up to the next 1, 2, 5 or 10 of its magnitude', () => {
      expect(niceStep(0.9)).toBe(1);
      expect(niceStep(1.4)).toBe(2);
      expect(niceStep(3)).toBe(5);
      expect(niceStep(7)).toBe(10);
      expect(niceStep(230)).toBe(500);
    });

    it('a non-positive rough step still yields a usable one', () => {
      expect(niceStep(0)).toBe(1);
      expect(niceStep(-5)).toBe(1);
    });
  });

  describe('niceScale', () => {
    it('rounds the domain outwards and lists the ticks', () => {
      const scale = niceScale(0, 97, 4);
      expect(scale.min).toBe(0);
      expect(scale.max).toBeGreaterThanOrEqual(97);
      expect(scale.values[0]).toBe(scale.min);
      expect(scale.values[scale.values.length - 1]).toBe(scale.max);
    });

    it('keeps the last tick despite floating point drift', () => {
      expect(niceScale(0, 1, 5).values).toEqual([0, 0.2, 0.4, 0.6000000000, 0.8, 1]);
    });

    it('a flat series gets a range around it instead of a zero-height plot', () => {
      const scale = niceScale(7, 7);
      expect(scale.min).toBeLessThan(7);
      expect(scale.max).toBeGreaterThan(7);
    });

    it('a flat series at zero still gets a range', () => {
      const scale = niceScale(0, 0);
      expect(scale.max).toBeGreaterThan(0);
    });

    it('survives a domain that is not a number', () => {
      const scale = niceScale(NaN, NaN);
      expect(Number.isFinite(scale.min)).toBe(true);
      expect(Number.isFinite(scale.max)).toBe(true);
    });

    it('takes the extremes in either order', () => {
      expect(niceScale(100, 0)).toEqual(niceScale(0, 100));
    });
  });

  describe('exactTicks', () => {
    it('respects the bounds it is given instead of rounding them', () => {
      const ticks = exactTicks(0, 97, 4);
      expect(ticks.min).toBe(0);
      expect(ticks.max).toBe(97);
      expect(ticks.values).toHaveLength(5);
      expect(ticks.values[4]).toBe(97);
    });

    it('takes the extremes in either order, and a collapsed one is a single tick', () => {
      expect(exactTicks(50, 10, 2).values).toEqual([10, 30, 50]);
      expect(exactTicks(7, 7).values).toEqual([7]);
    });
  });

  describe('growExtent', () => {
    it('keeps the widest of the two', () => {
      expect(growExtent([0, 10], [-5, 8])).toEqual([-5, 10]);
      expect(growExtent([0, 10], [2, 4])).toEqual([0, 10]);
    });

    it('with nothing before, the new one is the answer', () => {
      expect(growExtent(null, [1, 2])).toEqual([1, 2]);
    });
  });

  describe('lttbIndices', () => {
    const values = Array.from({ length: 100 }, (_, index) => Math.sin(index / 6) * 10);

    it('returns exactly the count asked for, first and last included', () => {
      const picked = lttbIndices(values, 20);
      expect(picked).toHaveLength(20);
      expect(picked[0]).toBe(0);
      expect(picked[picked.length - 1]).toBe(99);
    });

    it('comes back in order and without repeats', () => {
      const picked = lttbIndices(values, 25);
      expect([...picked].sort((a, b) => a - b)).toEqual(picked);
      expect(new Set(picked).size).toBe(picked.length);
    });

    it('keeps the peaks that a sample-every-N would eat', () => {
      // Una aguja aislada en un valle: el muestreo parejo la saltea, LTTB no.
      const spiky = Array.from({ length: 60 }, (_, index) => (index === 37 ? 100 : 0));
      expect(lttbIndices(spiky, 10)).toContain(37);
    });

    it('a hole counts as zero instead of poisoning the arithmetic', () => {
      const holed: (number | null)[] = [...values];
      holed[40] = null;
      expect(lttbIndices(holed, 15).every((index) => Number.isInteger(index))).toBe(true);
    });

    it('nothing to thin out, or too few buckets, hands everything back', () => {
      expect(lttbIndices([1, 2, 3], 10)).toEqual([0, 1, 2]);
      expect(lttbIndices(values, 2)).toHaveLength(100);
    });
  });

  describe('linearScale', () => {
    it('interpolates between the ends', () => {
      const scale = linearScale([0, 10], [0, 100]);
      expect(scale(0)).toBe(0);
      expect(scale(5)).toBe(50);
      expect(scale(10)).toBe(100);
    });

    it('inverts when the range does', () => {
      expect(linearScale([0, 10], [200, 0])(10)).toBe(0);
    });

    it('a collapsed domain lands in the middle of the range', () => {
      expect(linearScale([5, 5], [0, 100])(5)).toBe(50);
    });
  });

  describe('extent', () => {
    it('spans every series', () => {
      expect(extent(ROWS, ['sales', 'costs'])).toEqual([-6, 30]);
    });

    it('stacked adds the positives and the negatives on their own sides', () => {
      expect(extent(ROWS, ['sales', 'costs'], { stacked: true })).toEqual([-6, 30]);
    });

    it('includeZero pulls the domain to the baseline', () => {
      expect(extent([{ a: 5 }, { a: 9 }], ['a'], { includeZero: true })).toEqual([0, 9]);
      expect(extent([{ a: -5 }], ['a'], { includeZero: true })).toEqual([-5, 0]);
    });

    it('no usable data falls back to 0–1', () => {
      expect(extent([], ['a'])).toEqual([0, 1]);
      expect(extent([{ a: 'x' }], ['a'])).toEqual([0, 1]);
    });
  });

  describe('stackRow', () => {
    it('stacks positives up and negatives down from zero', () => {
      expect(stackRow({ a: 3, b: 2, c: -4 }, ['a', 'b', 'c'])).toEqual([
        { key: 'a', from: 0, to: 3, value: 3 },
        { key: 'b', from: 3, to: 5, value: 2 },
        { key: 'c', from: 0, to: -4, value: -4 },
      ]);
    });

    it('skips holes', () => {
      expect(stackRow({ a: 1, b: null }, ['a', 'b'])).toHaveLength(1);
    });
  });

  describe('polar', () => {
    it('puts 0° at twelve o clock and turns clockwise', () => {
      const center = { x: 0, y: 0 };
      expect(polar(center, 10, 0).y).toBeCloseTo(-10);
      expect(polar(center, 10, 90).x).toBeCloseTo(10);
      expect(polar(center, 10, 180).y).toBeCloseTo(10);
    });

    it('angleOf is its inverse, normalized to [0, 360)', () => {
      const center = { x: 50, y: 50 };
      expect(angleOf(center, polar(center, 20, 137))).toBeCloseTo(137);
      expect(angleOf(center, polar(center, 20, -30))).toBeCloseTo(330);
    });
  });

  describe('arcsFor', () => {
    it('splits 360° in proportion', () => {
      const arcs = arcsFor([1, 3]);
      expect(arcs).toHaveLength(2);
      expect(arcs[0]!.sweep).toBeCloseTo(90);
      expect(arcs[1]!.start).toBeCloseTo(90);
      expect(arcs[1]!.ratio).toBeCloseTo(0.75);
    });

    it('drops zeros and negatives instead of inverting them', () => {
      const arcs = arcsFor([5, 0, -3]);
      expect(arcs).toHaveLength(1);
      expect(arcs[0]!.index).toBe(0);
    });

    it('nothing to draw when the total is zero', () => {
      expect(arcsFor([0, 0])).toEqual([]);
      expect(arcsFor([])).toEqual([]);
    });

    it('arcAt finds the slice under an angle, and -1 outside every one', () => {
      const arcs = arcsFor([1, 1, 2]);
      expect(arcAt(arcs, 10)).toBe(0);
      expect(arcAt(arcs, 100)).toBe(1);
      expect(arcAt(arcs, 200)).toBe(2);
      expect(arcAt(arcs, -10)).toBe(2);
      expect(arcAt([], 10)).toBe(-1);
    });
  });

  describe('radarAngles', () => {
    it('starts at the top and splits the circle evenly', () => {
      expect(radarAngles(4)).toEqual([0, 90, 180, 270]);
      expect(radarAngles(0)).toEqual([]);
    });
  });

  describe('segmentBox', () => {
    it('turns two points into a rotated rectangle', () => {
      const box = segmentBox({ x: 0, y: 0 }, { x: 10, y: 0 }, 2);
      expect(box.width).toBe(10);
      expect(box.height).toBe(2);
      expect(box.rotate).toBe(0);
      expect(box.left).toBe(0);
      expect(box.top).toBe(-1);
    });

    it('a vertical segment is a rectangle rotated 90°', () => {
      expect(segmentBox({ x: 0, y: 0 }, { x: 0, y: 10 }, 2).rotate).toBeCloseTo(90);
    });
  });

  describe('smoothPoints', () => {
    const points = [
      { x: 0, y: 0 },
      { x: 10, y: 10 },
      { x: 20, y: 0 },
      { x: 30, y: 10 },
    ];

    it('adds samples between the points and keeps the originals', () => {
      const smooth = smoothPoints(points, 4);
      expect(smooth.length).toBeGreaterThan(points.length);
      expect(smooth[0]).toEqual(points[0]);
      expect(smooth[smooth.length - 1]!.x).toBeCloseTo(30);
    });

    it('too few points or too few steps leave the line alone', () => {
      expect(smoothPoints([{ x: 0, y: 0 }, { x: 1, y: 1 }])).toHaveLength(2);
      expect(smoothPoints(points, 1)).toBe(points);
    });
  });

  describe('sampleY', () => {
    const points = [
      { x: 0, y: 0 },
      { x: 10, y: 20 },
    ];

    it('interpolates inside the line', () => {
      expect(sampleY(points, 5)).toBe(10);
      expect(sampleY(points, 0)).toBe(0);
    });

    it('is null outside it', () => {
      expect(sampleY(points, 11)).toBeNull();
      expect(sampleY([], 1)).toBeNull();
    });

    it('a single point answers with itself', () => {
      expect(sampleY([{ x: 4, y: 9 }], 100)).toBe(9);
    });

    it('a vertical jump answers with the near end', () => {
      expect(sampleY([{ x: 5, y: 0 }, { x: 5, y: 10 }], 5)).toBe(0);
    });

    it('reads a line that runs backwards', () => {
      expect(sampleY([{ x: 10, y: 20 }, { x: 0, y: 0 }], 5)).toBe(10);
    });
  });

  describe('fanStrips', () => {
    const center = { x: 0, y: 0 };

    it('covers the whole turn once', () => {
      const points = radarAngles(5).map((angle) => polar(center, 10, angle));
      const strips = fanStrips(center, points, 4);
      const covered = strips.reduce((sum, strip) => sum + strip.sweep, 0);
      // Cada tira se solapa 0.4° a propósito; sin eso el total sería 360.
      expect(covered).toBeGreaterThanOrEqual(360);
      expect(covered).toBeLessThan(360 + strips.length * 0.5);
    });

    it('the radius follows the polygon, not a circle', () => {
      const points = [
        polar(center, 20, 0),
        polar(center, 5, 120),
        polar(center, 5, 240),
      ];
      const strips = fanStrips(center, points, 3);
      const radii = strips.map((strip) => strip.radius);
      expect(Math.max(...radii)).toBeGreaterThan(Math.min(...radii) + 1);
    });

    it('needs a polygon and at least one step', () => {
      expect(fanStrips(center, [{ x: 1, y: 1 }, { x: 2, y: 2 }], 3)).toEqual([]);
      expect(fanStrips(center, radarAngles(4).map((a) => polar(center, 5, a)), 0)).toEqual([]);
    });
  });

  describe('formatNumber', () => {
    it('shortens by thousands', () => {
      expect(formatNumber(950)).toBe('950');
      expect(formatNumber(1200)).toBe('1.2k');
      expect(formatNumber(1_250_000)).toBe('1.3M');
      expect(formatNumber(2_000_000_000)).toBe('2B');
      expect(formatNumber(-1500)).toBe('-1.5k');
      expect(formatNumber(12000)).toBe('12k');
    });

    it('a non-number prints nothing', () => {
      expect(formatNumber(NaN)).toBe('');
    });
  });
});

describe('chart/palette', () => {
  const theme = createTheme().light;

  it('gives as many colors as series are asked for', () => {
    expect(seriesPalette(theme, 3)).toHaveLength(3);
    expect(seriesPalette(theme, 12)).toHaveLength(12);
  });

  it('is stable: the same index keeps the same color', () => {
    expect(seriesPalette(theme, 10)[2]).toBe(seriesPalette(theme, 4)[2]);
  });

  it('every color clears 3:1 against the surface it sits on', () => {
    for (const color of seriesPalette(theme, 12)) {
      expect(contrast(color, theme.colors.surface)).toBeGreaterThanOrEqual(GRAPHIC_CONTRAST - 0.01);
    }
  });

  it('works in dark too', () => {
    const dark = createTheme().dark;
    for (const color of seriesPalette(dark, 8)) {
      expect(contrast(color, dark.colors.surface)).toBeGreaterThanOrEqual(GRAPHIC_CONTRAST - 0.01);
    }
  });

  it('a theme whose accents are not hex falls back to them instead of throwing', () => {
    const broken = {
      ...theme,
      colors: { ...theme.colors, primary: 'rgba(0,0,0,0.5)' },
    };
    expect(() => seriesPalette(broken, 8)).not.toThrow();
    expect(seriesPalette(broken, 8)).toHaveLength(8);
  });
});
