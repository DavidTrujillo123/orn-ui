import React, { createContext, memo, useCallback, useContext, useMemo, useRef, useState } from 'react';
import {
  Pressable,
  Text,
  View,
  type GestureResponderEvent,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { contrast } from '../theme/colors';
import { createStyles } from '../theme/createStyles';
import { useAllowFontScaling, useLabels, useTheme } from '../theme/UIProvider';
import { useReduceMotion } from '../theme/useReduceMotion';
import { SegmentedControl } from '../molecules/SegmentedControl';
import { Bar, Dot, Polyline, Wedge } from './chart/marks';
import { AxisLabels, CartesianGrid, Legend, RadarGrid, Tooltip, type LegendItem, type TooltipRow } from './chart/frame';
import { seriesPalette } from './chart/palette';
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
  polar,
  radarAngles,
  sampleY,
  smoothPoints,
  stackRow,
  toNumber,
  type ChartRow,
  type Point,
} from './chart/math';

export type { ChartRow } from './chart/math';

export type ChartType = 'bar' | 'line' | 'area' | 'pie' | 'donut' | 'radar';

export interface ChartSeries {
  /** Column of `data` this series reads. */
  key: string;
  /** Text shown in the legend and tooltip. Defaults to `key`. */
  label?: string;
  /** Overrides the color derived from the theme. */
  color?: string;
}

export interface ChartFilterOption {
  value: string;
  label: string;
}

/**
 * A filter in the top bar. Chart doesn't filter anything on its own: it shows
 * the control and reports. Whoever has the data decides what "last 7 days"
 * means, and that can't be guessed from here.
 */
export interface ChartFilter {
  key: string;
  options: ChartFilterOption[];
  value: string;
  onChange: (value: string) => void;
}

export interface ChartSelection {
  /**
   * Row identity, stable across a `window` or decimation. Comes from
   * `selectBy`; without it, it is the index, which does not survive the data
   * shifting.
   */
  id: string;
  /**
   * Index within the **drawn** rows, not `data`: with `window` or decimation
   * they are not the same list. Use `row` to get back to the datum.
   */
  index: number;
  /** The whole row, without resolving the index against anything. */
  row: ChartRow;
  /** Value of `xKey` in that row. */
  label: string;
  /** Series that was touched. In a pie it is the row, which is the category there. */
  seriesKey: string;
  value: number;
}

interface ChartBaseProps {
  /** Rows: one per category, with the label in `xKey` and one column per series. */
  data: ChartRow[];
  /**
   * Series to draw. 'pie'/'donut' only use the first one: a pie's categories
   * are the rows, not the columns.
   */
  series: ChartSeries[];
  /** Column holding each row's label. @default 'x' */
  xKey?: string;
  /**
   * Stable identity of a row. Without it the selection is stored by index,
   * and in a sliding window the index shifts: the highlighted point ends up
   * pointing at another datum without anyone touching it. With it the
   * highlight follows the datum and disappears only when it leaves the window.
   */
  selectBy?: (row: ChartRow, index: number) => string;
  /**
   * Draws only the last N rows. It is the sliding window of a live chart: the
   * code pushing data doesn't have to trim it on every tick.
   */
  window?: number;
  /** Height of the plot area, excluding filters and legend. @default 220 */
  height?: number;
  /**
   * 'toggle' turns the legend into the cheapest filter a chart has: tapping a
   * series hides it. @default 'auto' (toggle with 2+ series, none with one)
   */
  legend?: 'auto' | 'none' | 'static' | 'toggle';
  /** Hidden series (controlled). Without it, Chart tracks them itself. */
  hiddenKeys?: string[];
  /** Series hidden at first (uncontrolled). @default [] */
  defaultHiddenKeys?: string[];
  /** Called when the legend shows or hides a series. */
  onHiddenKeysChange?: (keys: string[]) => void;
  /** Controls above the chart, one per filter. */
  filters?: ChartFilter[];
  /** Highlighted point (controlled). `null` means none. */
  selected?: ChartSelection | null;
  /** Called when a category is tapped, with `null` when it is released. */
  onSelect?: (selection: ChartSelection | null) => void;
  /** Bubble with the values of the touched category. @default true */
  tooltip?: boolean;
  /** Formats values on the axis, tooltip and slices. @default compact format: 1.2k, 3.4M */
  formatValue?: (value: number) => string;
  /** Marks grow in on mount and morph on data changes (off with Reduce Motion). @default true */
  animate?: boolean;
  /** Duration in ms of the marks' animation. @default tokens.duration.slow * 2 */
  duration?: number;
  /** Text shown when there is nothing left to draw. */
  emptyText?: string;
  /** Required: a chart has no text that describes it. */
  accessibilityLabel: string;
  /**
   * Color behind the chart. The donut hole and the ring around points are
   * painted with it, so they must match whatever the chart sits on.
   * @default colors.surfaceRaised (a Chart usually lives in a Card)
   */
  surfaceColor?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/** Background the marks paint "holes" with (donut center, point rings). */
const ChartSurfaceContext = createContext<string | undefined>(undefined);
function useChartSurface(): string {
  const theme = useTheme();
  return useContext(ChartSurfaceContext) ?? theme.colors.surfaceRaised;
}

interface CartesianProps {
  /**
   * Fixes the value axis. By default it is recomputed with every datum, which
   * is right for a static chart and worst for a live one: a higher value
   * arrives, the whole scale shifts and the line jumps even though the data
   * didn't move.
   *
   * - `[min, max]` — exact, not rounded to nice numbers.
   * - `'sticky'` — starts from the data and grows when something doesn't fit,
   *   but never shrinks back.
   */
  domain?: [number, number] | 'sticky';
  /** Reference lines on the value axis. @default true */
  grid?: boolean;
  /** Target tick count on the value axis; rounding may yield one more or one fewer. @default 4 */
  ticks?: number;
  /** Labels on the horizontal axis. @default true */
  xAxis?: boolean;
  /** Labels on the vertical axis. @default true */
  yAxis?: boolean;
}

interface BarChartProps extends CartesianProps {
  /** Kind of chart. Props marked "Only with type" depend on it. */
  type: 'bar';
  /** 'horizontal' puts the categories on the vertical axis. @default 'vertical' */
  orientation?: 'vertical' | 'horizontal';
  /** Stacks the series instead of placing them side by side. @default false */
  stacked?: boolean;
  /** Radius of each bar's free end. @default radius.xs */
  barRadius?: number;
}

interface LineChartProps extends CartesianProps {
  type: 'line';
  /**
   * Maximum number of points to draw, picked with LTTB. Defaults to a value
   * derived from the measured width: more than one point every two pixels
   * isn't visible but still costs. `false` draws them all.
   */
  decimate?: number | false;
  /** Catmull-Rom curves instead of straight segments. @default false */
  smooth?: boolean;
  /** Line width in pt. @default 2 */
  thickness?: number;
  /** A dot on each datum. @default true */
  dots?: boolean;
}

interface AreaChartProps extends CartesianProps {
  type: 'area';
  /** Same as in 'line'. */
  decimate?: number | false;
  smooth?: boolean;
  thickness?: number;
  /** @default false */
  dots?: boolean;
  /** @default false */
  stacked?: boolean;
  /** Opacity of the fill under the line. @default 0.22 */
  fillOpacity?: number;
}

interface PieBaseProps {
  /** Hole as a fraction of the radius, 0–0.9. @default 0 for 'pie', 0.6 for 'donut' */
  innerRadius?: number;
  /** What to write on each slice. @default 'percent' */
  sliceLabels?: 'none' | 'percent' | 'value';
}

// 'pie' and 'donut' are kept separate even though they share everything: with
// a single member whose `type` were `'pie' | 'donut'`, TypeScript doesn't drop
// that member from the union when ruling it out, and the rest of the component
// stops narrowing.
interface PieChartProps extends PieBaseProps {
  type: 'pie';
}

interface DonutChartProps extends PieBaseProps {
  type: 'donut';
}

interface RadarChartProps {
  type: 'radar';
  /**
   * Fixes the axes' range. A radar measures from the center, so the minimum is
   * always 0 and only `max` of `[min, max]` is used.
   */
  domain?: [number, number] | 'sticky';
  /** Rings of the web. @default 4 */
  levels?: number;
  /** Fills the polygon in addition to drawing its outline. @default true */
  fill?: boolean;
  thickness?: number;
  /** @default true */
  dots?: boolean;
}

export type ChartProps = ChartBaseProps &
  (BarChartProps | LineChartProps | AreaChartProps | PieChartProps | DonutChartProps | RadarChartProps);

const DEFAULT_HEIGHT = 220;
const DEFAULT_TICKS = 4;
/** Floor of the value-label gutter, on the left. */
const VALUE_GUTTER = 38;
/**
 * Estimated width of a label character. React Native doesn't measure text
 * without rendering it, and measuring to decide the layout would make the
 * chart show up shifted for a frame; at `fontSize.xs` a digit is around
 * 0.6em, and too much is better than too little — extra room, no clipped number.
 */
const VALUE_CHAR = 6.5;
/** Gutter cap: a wide axis can't eat the plot. */
const VALUE_GUTTER_MAX = 0.3;
/** Category gutter when they go on the left (horizontal bars). */
const CATEGORY_GUTTER = 64;
/** Gutter for the bottom labels. */
const BOTTOM_GUTTER = 16;
/** Fraction of the band width taken by the bars; the rest is room. */
const BAND_FILL = 0.7;
/** Room around the radar so the axis labels fit. */
const RADAR_INSET = 26;
const DIM_OPACITY = 0.3;

const useStyles = createStyles((theme) => ({
  root: { alignSelf: 'stretch' },
  filters: { gap: theme.tokens.spacing.sm, marginBottom: theme.tokens.spacing.md },
  plot: { position: 'relative', overflow: 'visible' },
  empty: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: { fontSize: theme.tokens.fontSize.sm, color: theme.colors.textLight },
  sliceLabel: {
    position: 'absolute',
    fontSize: theme.tokens.fontSize.xs,
    fontWeight: theme.tokens.fontWeight.semibold,
    textAlign: 'center',
  },
  radarAxisLabel: {
    position: 'absolute',
    fontSize: theme.tokens.fontSize.xs,
    color: theme.colors.textLight,
    textAlign: 'center',
  },
}));

/** Controlled or own state, with the same contract in both cases. */
function useControlled<T>(controlled: T | undefined, fallback: T): [T, (next: T) => void, boolean] {
  const [own, setOwn] = useState(fallback);
  const isControlled = controlled !== undefined;
  return [isControlled ? (controlled as T) : own, setOwn, isControlled];
}

/**
 * Resolves the value axis domain from what the consumer asked for. In
 * 'sticky' the reference lives in a ref: what matters isn't this render's
 * domain but the widest one seen so far, and keeping it in state would fire
 * an extra render for every tick that widens the axis.
 */
function useDomain(measured: [number, number], domain: [number, number] | 'sticky' | undefined): [number, number] {
  const widest = useRef<[number, number] | null>(null);
  if (domain === 'sticky') {
    widest.current = growExtent(widest.current, measured);
    return widest.current;
  }
  widest.current = null;
  return domain ?? measured;
}

/**
 * Chart
 * Bars (vertical, horizontal, grouped, stacked), line, area, pie, donut and
 * radar in a single component, because what changes between them is the mark
 * being drawn and not the rest: data, scale, axes, legend, tooltip, selection
 * and filters are the same six mechanisms in all of them.
 *
 * It is drawn with `View`: React Native ships no vector canvas and the library
 * can't add one. The three primitives are in `chart/marks.tsx` and the whole
 * geometry, without React, in `chart/math.ts`.
 *
 * Gestalt: common fate — when you tap a category, everything that isn't it
 * drops to {@link DIM_OPACITY} at once, so what is highlighted reads as a group
 * and not as a loose mark. The legend uses similarity: the same color as the
 * series, which is why it can turn it off without having to explain what it
 * turns off.
 */
export function Chart(props: ChartProps) {
  const {
    data,
    series,
    xKey = 'x',
    selectBy,
    window: windowSize,
    height = DEFAULT_HEIGHT,
    legend = 'auto',
    hiddenKeys,
    defaultHiddenKeys,
    onHiddenKeysChange,
    filters,
    selected,
    onSelect,
    tooltip = true,
    formatValue = formatNumber,
    animate: animateProp = true,
    duration,
    emptyText,
    accessibilityLabel,
    surfaceColor,
    style,
    testID,
  } = props;

  const theme = useTheme();
  const styles = useStyles();
  const allowFontScaling = useAllowFontScaling();
  const uiLabels = useLabels();
  // Reduce Motion: the marks appear in their final shape instead of growing.
  const reduceMotion = useReduceMotion();
  const animate = animateProp && !reduceMotion;
  const [width, setWidth] = useState(0);

  const [hidden, setHidden, hiddenIsControlled] = useControlled(hiddenKeys, defaultHiddenKeys ?? []);
  const [pick, setPick, selectionIsControlled] = useControlled<ChartSelection | null>(selected, null);

  const isPie = props.type === 'pie' || props.type === 'donut';
  const polyline = props.type === 'line' || props.type === 'area';
  const decimate = polyline ? props.decimate : false;

  /**
   * What gets drawn: the window of `data`, and from that the points that fit.
   * Decimation runs over the whole row, chosen with the first visible series:
   * the series share the x axis, so keeping different indexes per series would
   * break the alignment, the touch layer and the tooltip.
   */
  const rows = useMemo(() => {
    const windowed = windowSize && windowSize > 0 ? data.slice(-windowSize) : data;
    if (!polyline || decimate === false || width === 0) return windowed;
    // One point every two pixels: more can't be seen but still has to be paid for.
    const target = typeof decimate === 'number' ? decimate : Math.floor(width / 2);
    if (windowed.length <= target) return windowed;
    const lead = series.find((item) => !hidden.includes(item.key))?.key ?? series[0]?.key;
    const values = windowed.map((row) => (lead ? toNumber(row[lead]) : null));
    return lttbIndices(values, target).map((index) => windowed[index]!);
  }, [data, windowSize, polyline, decimate, width, series, hidden]);

  const labels = useMemo(() => rows.map((row) => String(row[xKey] ?? '')), [rows, xKey]);
  const ids = useMemo(
    () => rows.map((row, index) => (selectBy ? selectBy(row, index) : String(index))),
    [rows, selectBy]
  );

  /**
   * The selection is stored by `id` and resolved against the current rows:
   * if the datum shifted, the highlight follows it; if it left the window, it
   * disappears. Blindly reusing the index would point at the datum that ended
   * up in that spot, which isn't the one anyone picked.
   */
  const selection = useMemo(() => {
    if (!pick) return null;
    const index = ids.indexOf(pick.id);
    if (index === -1) return null;
    const row = rows[index]!;
    return {
      ...pick,
      index,
      row,
      label: labels[index] ?? pick.label,
      value: toNumber(row[pick.seriesKey]) ?? pick.value,
    };
  }, [pick, ids, rows, labels]);

  // In a pie the categories are the rows; in the rest, the columns. The
  // color, the legend and what a tap on it turns off depend on that.
  const palette = seriesPalette(theme, Math.max(1, isPie ? rows.length : series.length));
  const entries: LegendItem[] = useMemo(
    () =>
      isPie
        ? labels.map((label, index) => ({ key: label, label, color: series[0]?.color ?? palette[index] ?? theme.colors.primary }))
        : series.map((item, index) => ({
            key: item.key,
            label: item.label ?? item.key,
            color: item.color ?? palette[index] ?? theme.colors.primary,
          })),
    [isPie, labels, series, palette, theme.colors.primary]
  );

  const visible = useMemo(() => entries.filter((entry) => !hidden.includes(entry.key)), [entries, hidden]);
  const duration_ = duration ?? theme.tokens.duration.slow * 2;

  const applyHidden = useCallback(
    (key: string) => {
      const next = hidden.includes(key) ? hidden.filter((k) => k !== key) : [...hidden, key];
      if (!hiddenIsControlled) setHidden(next);
      onHiddenKeysChange?.(next);
    },
    [hidden, hiddenIsControlled, setHidden, onHiddenKeysChange]
  );

  /**
   * The plots report what was tapped —row and series— and the whole selection
   * is built here: it is the only place that knows `selectBy`, the labels and
   * the actual rows, so the three don't repeat the building.
   */
  const applySelection = useCallback(
    (hit: { index: number; seriesKey: string } | null) => {
      const row = hit ? rows[hit.index] : undefined;
      const next: ChartSelection | null =
        hit && row
          ? {
              id: ids[hit.index] ?? String(hit.index),
              index: hit.index,
              row,
              label: labels[hit.index] ?? '',
              seriesKey: hit.seriesKey,
              value: toNumber(row[hit.seriesKey]) ?? 0,
            }
          : null;
      // Tapping what is already selected releases it: without that there would
      // be no way back to the whole chart without tapping outside, and
      // "outside" doesn't always exist on a scrolling screen.
      const same = next && selection && next.id === selection.id && next.seriesKey === selection.seriesKey;
      const value = same ? null : next;
      if (!selectionIsControlled) setPick(value);
      onSelect?.(value);
    },
    [rows, ids, labels, selection, selectionIsControlled, setPick, onSelect]
  );

  const onLayout = useCallback((event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width), []);

  const showLegend = legend === 'toggle' || legend === 'static' || (legend === 'auto' && entries.length > 1);
  const toggleable = legend === 'toggle' || (legend === 'auto' && entries.length > 1);
  const empty = rows.length === 0 || visible.length === 0;

  const shared = {
    rows,
    labels,
    entries,
    visible,
    width,
    height,
    formatValue,
    animate,
    duration: duration_,
    selection,
    onPick: applySelection,
    tooltip,
    testID,
  };

  return (
    <ChartSurfaceContext.Provider value={surfaceColor ?? theme.colors.surfaceRaised}>
    <View style={[styles.root, style]} testID={testID} accessible={false}>
      {filters && filters.length > 0 ? (
        <View style={styles.filters}>
          {filters.map((filter) => (
            <SegmentedControl
              key={filter.key}
              options={filter.options}
              value={filter.value}
              onChange={filter.onChange}
              testID={testID && `${testID}-filter-${filter.key}`}
            />
          ))}
        </View>
      ) : null}

      <View
        style={[styles.plot, { height }]}
        onLayout={onLayout}
        accessible
        accessibilityRole="image"
        accessibilityLabel={accessibilityLabel}
        testID={testID && `${testID}-plot`}
      >
        {width === 0 || empty ? null : props.type === 'pie' || props.type === 'donut' ? (
          <PiePlot
            {...shared}
            donut={props.type === 'donut'}
            innerRadius={props.innerRadius}
            sliceLabels={props.sliceLabels ?? 'percent'}
            valueKey={series[0]?.key ?? ''}
          />
        ) : props.type === 'radar' ? (
          <RadarPlot
            {...shared}
            domain={props.domain}
            levels={props.levels ?? 4}
            fill={props.fill ?? true}
            thickness={props.thickness ?? 2}
            dots={props.dots ?? true}
          />
        ) : (
          <CartesianPlot
            {...shared}
            type={props.type}
            orientation={props.type === 'bar' ? (props.orientation ?? 'vertical') : 'vertical'}
            stacked={props.type === 'bar' || props.type === 'area' ? (props.stacked ?? false) : false}
            barRadius={props.type === 'bar' ? (props.barRadius ?? theme.tokens.radius.xs) : 0}
            smooth={props.type !== 'bar' ? (props.smooth ?? false) : false}
            thickness={props.type !== 'bar' ? (props.thickness ?? 2) : 0}
            dots={props.type === 'line' ? (props.dots ?? true) : props.type === 'area' ? (props.dots ?? false) : false}
            fillOpacity={props.type === 'area' ? (props.fillOpacity ?? 0.22) : 0}
            domain={props.domain}
            grid={props.grid ?? true}
            ticks={props.ticks ?? DEFAULT_TICKS}
            xAxis={props.xAxis ?? true}
            yAxis={props.yAxis ?? true}
          />
        )}

        {empty ? (
          <View style={styles.empty} testID={testID && `${testID}-empty`}>
            <Text allowFontScaling={allowFontScaling} style={styles.emptyText}>
              {emptyText ?? uiLabels.noResultsTitle}
            </Text>
          </View>
        ) : null}
      </View>

      {showLegend ? (
        <Legend items={entries} hidden={hidden} onToggle={toggleable ? applyHidden : undefined} testID={testID && `${testID}-legend`} />
      ) : null}
    </View>
    </ChartSurfaceContext.Provider>
  );
}

Chart.displayName = 'Chart';

// ── what the three plots share ─────────────────────────────────────────────

interface PlotProps {
  rows: ChartRow[];
  labels: string[];
  /** All categories, with their color: the color doesn't change when one is turned off. */
  entries: LegendItem[];
  /** The ones still turned on. */
  visible: LegendItem[];
  width: number;
  height: number;
  formatValue: (value: number) => string;
  animate: boolean;
  duration: number;
  selection: ChartSelection | null;
  /** Reports what was tapped; Chart builds the selection. `null` releases it. */
  onPick: (hit: { index: number; seriesKey: string } | null) => void;
  tooltip: boolean;
  testID?: string;
}

/** Tooltip rows for a category on the x axis. */
function tooltipRowsAt(rows: ChartRow[], index: number, visible: LegendItem[], format: (value: number) => string): TooltipRow[] {
  const row = rows[index];
  if (!row) return [];
  return visible
    .map((entry) => {
      const value = toNumber(row[entry.key]);
      return value === null ? null : { key: entry.key, label: entry.label, value: format(value), color: entry.color };
    })
    .filter((item): item is TooltipRow => item !== null);
}

// ── bars, line and area ────────────────────────────────────────────────────

interface CartesianPlotProps extends PlotProps {
  type: 'bar' | 'line' | 'area';
  orientation: 'vertical' | 'horizontal';
  stacked: boolean;
  barRadius: number;
  smooth: boolean;
  thickness: number;
  dots: boolean;
  fillOpacity: number;
  domain?: [number, number] | 'sticky';
  grid: boolean;
  ticks: number;
  xAxis: boolean;
  yAxis: boolean;
}

/** Width of one strip of the area fill, in pixels. Thinner = more views. */
const STRIP_WIDTH = 4;
const MAX_STRIPS = 140;
/** Room between two bars of the same group. */
const GROUP_GAP = 2;

const CartesianPlot = memo((props: CartesianPlotProps) => {
  const {
    rows,
    labels,
    visible,
    width,
    height,
    formatValue,
    animate,
    duration,
    selection,
    onPick,
    tooltip,
    testID,
    type,
    orientation,
    stacked,
    barRadius,
    smooth,
    thickness,
    dots,
    fillOpacity,
    domain,
    grid,
    ticks: tickCount,
    xAxis,
    yAxis,
  } = props;

  const theme = useTheme();
  const surface = useChartSurface();
  const horizontal = type === 'bar' && orientation === 'horizontal';
  const keys = useMemo(() => visible.map((entry) => entry.key), [visible]);

  const bottomGutter = xAxis ? BOTTOM_GUTTER : 0;

  // The line may not touch zero (a temperature, a ranking); a bar does have
  // to, because its length is what states the value.
  const measured = useMemo(
    () => extent(rows, keys, { stacked, includeZero: type !== 'line' }),
    [rows, keys, stacked, type]
  );
  const [low, high] = useDomain(measured, domain);

  // A hand-set domain is respected as is; a measured one (or 'sticky') is
  // rounded, which is what makes the axis legible.
  const nice = useMemo(
    () => (Array.isArray(domain) ? exactTicks(low, high, tickCount) : niceScale(low, high, tickCount)),
    [domain, low, high, tickCount]
  );

  /**
   * The gutter comes from the longest label, not from a constant: with a
   * custom `formatValue` ("$3000", "1.250 ms") a fixed width clips the number
   * and the axis ends up saying "$30…". The ticks don't depend on the plot's
   * width, so they can be measured before splitting it up.
   */
  const leftGutter = useMemo(() => {
    if (!yAxis) return 0;
    if (horizontal) return CATEGORY_GUTTER;
    const longest = nice.values.reduce((widest, value) => Math.max(widest, formatValue(value).length), 0);
    const wanted = Math.ceil(longest * VALUE_CHAR) + theme.tokens.spacing.sm;
    return Math.max(VALUE_GUTTER, Math.min(wanted, Math.floor(width * VALUE_GUTTER_MAX)));
  }, [yAxis, horizontal, nice, formatValue, width, theme.tokens.spacing.sm]);

  const plotW = Math.max(1, width - leftGutter);
  const plotH = Math.max(1, height - bottomGutter);

  const toPixel = useMemo(
    () =>
      horizontal
        ? linearScale([nice.min, nice.max], [0, plotW])
        : linearScale([nice.min, nice.max], [plotH, 0]),
    [horizontal, nice, plotW, plotH]
  );
  const scale = useMemo(() => ({ nice, toPixel }), [nice, toPixel]);

  const band = (horizontal ? plotH : plotW) / Math.max(1, rows.length);
  const centerOf = useCallback((index: number) => (index + 0.5) * band, [band]);
  const baseline = scale.toPixel(clamp(0, scale.nice.min, scale.nice.max));

  const stacks = useMemo(() => (stacked ? rows.map((row) => stackRow(row, keys)) : null), [stacked, rows, keys]);

  /** A series' points: `to` is the value, `from` the floor it is filled from. */
  const pointsFor = useCallback(
    (key: string, edge: 'to' | 'from'): Point[] => {
      const out: Point[] = [];
      rows.forEach((row, index) => {
        if (stacks) {
          const stackBand = stacks[index]!.find((item) => item.key === key);
          if (!stackBand) return;
          out.push({ x: centerOf(index), y: scale.toPixel(stackBand[edge]) });
          return;
        }
        const value = toNumber(row[key]);
        if (value === null) return;
        out.push({ x: centerOf(index), y: edge === 'to' ? scale.toPixel(value) : baseline });
      });
      return out;
    },
    [rows, stacks, centerOf, scale, baseline]
  );

  const pickAt = useCallback(
    (index: number, event: GestureResponderEvent) => {
      // Which series the finger landed on: the one whose mark is closest to
      // the touch on the value axis. With a single series it is always that one.
      const touch = (horizontal ? event?.nativeEvent?.locationX : event?.nativeEvent?.locationY) ?? 0;
      let bestKey = keys[0] ?? '';
      let bestDistance = Infinity;
      for (const key of keys) {
        const value = toNumber(rows[index]?.[key]);
        if (value === null) continue;
        const distance = Math.abs(scale.toPixel(value) - touch);
        if (distance < bestDistance) {
          bestDistance = distance;
          bestKey = key;
        }
      }
      onPick({ index, seriesKey: bestKey });
    },
    [horizontal, keys, rows, scale, onPick]
  );

  const gridLines = scale.nice.values.map((value) => scale.toPixel(value));
  const zeroIndex = scale.nice.values.findIndex((value) => value === 0);

  const rowsForTooltip = selection ? tooltipRowsAt(rows, selection.index, visible, formatValue) : [];
  const anchor: Point | null = !selection
    ? null
    : horizontal
      ? {
          x: leftGutter + Math.max(...visible.map((entry) => scale.toPixel(toNumber(rows[selection.index]?.[entry.key]) ?? 0))),
          y: centerOf(selection.index),
        }
      : {
          x: leftGutter + centerOf(selection.index),
          y: Math.min(...visible.map((entry) => scale.toPixel(toNumber(rows[selection.index]?.[entry.key]) ?? 0))),
        };

  return (
    <>
      {/* Frame: grid and labels, beneath the marks. */}
      <View style={{ position: 'absolute', left: leftGutter, top: 0, width: plotW, height: plotH }}>
        {grid ? (
          <CartesianGrid
            width={plotW}
            height={plotH}
            lines={gridLines}
            orientation={horizontal ? 'vertical' : 'horizontal'}
            zeroIndex={zeroIndex === -1 ? undefined : zeroIndex}
            testID={testID && `${testID}-grid`}
          />
        ) : null}

        {type === 'bar'
          ? rows.map((row, rowIndex) => {
              const fill = band * BAND_FILL;
              const slot = fill / (stacked ? 1 : Math.max(1, keys.length));
              const bands = stacks
                ? stacks[rowIndex]!.filter((item) => keys.includes(item.key))
                : keys
                    .map((key) => {
                      const value = toNumber(row[key]);
                      return value === null ? null : { key, from: 0, to: value, value };
                    })
                    .filter((item): item is { key: string; from: number; to: number; value: number } => item !== null);

              return bands.map((item) => {
                const seriesIndex = keys.indexOf(item.key);
                const color = visible[seriesIndex]?.color ?? theme.colors.primary;
                const start = centerOf(rowIndex) - fill / 2 + (stacked ? 0 : seriesIndex * slot);
                const thicknessOfBar = Math.max(1, slot - (stacked || keys.length === 1 ? 0 : GROUP_GAP));
                const near = scale.toPixel(item.from);
                const far = scale.toPixel(item.to);
                const size = Math.abs(far - near);
                const positive = item.value >= 0;
                const dim = !!selection && selection.index !== rowIndex;

                return horizontal ? (
                  <Bar
                    key={`${rowIndex}-${item.key}`}
                    x={positive ? near : plotW - near}
                    y={start}
                    width={size}
                    height={thicknessOfBar}
                    from={positive ? 'left' : 'right'}
                    color={color}
                    radius={barRadius}
                    dim={dim}
                    animate={animate}
                    duration={duration}
                    testID={testID && `${testID}-bar-${rowIndex}-${item.key}`}
                  />
                ) : (
                  <Bar
                    key={`${rowIndex}-${item.key}`}
                    x={start}
                    y={positive ? plotH - near : near}
                    width={thicknessOfBar}
                    height={size}
                    from={positive ? 'bottom' : 'top'}
                    color={color}
                    radius={barRadius}
                    dim={dim}
                    animate={animate}
                    duration={duration}
                    testID={testID && `${testID}-bar-${rowIndex}-${item.key}`}
                  />
                );
              });
            })
          : visible.map((entry) => {
              const raw = pointsFor(entry.key, 'to');
              const line = smooth ? smoothPoints(raw) : raw;
              const base = smooth ? smoothPoints(pointsFor(entry.key, 'from')) : pointsFor(entry.key, 'from');
              const stripCount = Math.min(MAX_STRIPS, Math.max(8, Math.round(plotW / STRIP_WIDTH)));
              const stripWidth = plotW / stripCount;

              return (
                <View key={entry.key} style={{ position: 'absolute', left: 0, top: 0, width: plotW, height: plotH }}>
                  {/* Area: without `path` there is no fill under a curve, so it
                      is cut into vertical strips and each one asks the polyline
                      for its height. At 4px per strip the edge already reads as continuous. */}
                  {type === 'area' ? (
                    // Opacity goes on the group, not on each strip: the half
                    // pixel of overlap that hides the antialias seam is
                    // composited twice and leaves a vertical stripe every four
                    // pixels. Dimming the whole group, it is painted only once.
                    <View
                      pointerEvents="none"
                      style={{ position: 'absolute', left: 0, top: 0, width: plotW, height: plotH, opacity: fillOpacity }}
                    >
                      {Array.from({ length: stripCount }, (_, strip) => {
                        const x = (strip + 0.5) * stripWidth;
                        const top = sampleY(line, x);
                        const bottom = sampleY(base, x);
                        if (top === null || bottom === null) return null;
                        return (
                          <View
                            key={strip}
                            style={{
                              position: 'absolute',
                              left: strip * stripWidth,
                              width: stripWidth + 0.5,
                              top: Math.min(top, bottom),
                              height: Math.abs(bottom - top),
                              backgroundColor: entry.color,
                            }}
                          />
                        );
                      })}
                    </View>
                  ) : null}

                  <Polyline points={line} color={entry.color} thickness={thickness} testID={testID && `${testID}-line-${entry.key}`} />

                  {dots
                    ? raw.map((point, index) => (
                        <Dot
                          key={index}
                          point={point}
                          color={entry.color}
                          ringColor={surface}
                          size={selection?.index === index ? 8 : 6}
                          testID={testID && `${testID}-dot-${entry.key}-${index}`}
                        />
                      ))
                    : null}
                </View>
              );
            })}

        {/* Touch layer: a whole band per category. Tapping a 2px line is
            impossible; tapping its column isn't. */}
        {rows.map((row, index) => (
          <Pressable
            key={index}
            onPress={(event) => pickAt(index, event)}
            accessibilityRole="button"
            accessibilityState={{ selected: selection?.index === index }}
            accessibilityLabel={[labels[index], ...tooltipRowsAt(rows, index, visible, formatValue).map((item) => `${item.label} ${item.value}`)].join(', ')}
            style={
              horizontal
                ? { position: 'absolute', left: 0, width: plotW, top: index * band, height: band }
                : { position: 'absolute', top: 0, height: plotH, left: index * band, width: band }
            }
            testID={testID && `${testID}-band-${index}`}
          />
        ))}
      </View>

      {yAxis ? (
        <View style={{ position: 'absolute', left: 0, top: 0, width: leftGutter, height: plotH }}>
          <AxisLabels
            axis="y"
            gutter={Math.max(0, leftGutter - 6)}
            span={plotH}
            labels={
              horizontal
                ? labels.map((text, index) => ({ text, position: centerOf(index) }))
                : scale.nice.values.map((value) => ({ text: formatValue(value), position: scale.toPixel(value) }))
            }
            testID={testID && `${testID}-y-axis`}
          />
        </View>
      ) : null}

      {xAxis ? (
        <View style={{ position: 'absolute', left: leftGutter, top: plotH + 2, width: plotW, height: bottomGutter }}>
          <AxisLabels
            axis="x"
            gutter={0}
            span={plotW}
            labels={
              horizontal
                ? scale.nice.values.map((value) => ({ text: formatValue(value), position: scale.toPixel(value) }))
                : labels.map((text, index) => ({ text, position: centerOf(index) }))
            }
            testID={testID && `${testID}-x-axis`}
          />
        </View>
      ) : null}

      {tooltip && selection && anchor && rowsForTooltip.length > 0 ? (
        <Tooltip
          title={selection.label}
          rows={rowsForTooltip}
          anchor={anchor}
          containerWidth={width}
          testID={testID && `${testID}-tooltip`}
        />
      ) : null}
    </>
  );
});
CartesianPlot.displayName = 'CartesianPlot';

// ── pie and donut ──────────────────────────────────────────────────────────

interface PiePlotProps extends PlotProps {
  donut: boolean;
  innerRadius?: number;
  sliceLabels: 'none' | 'percent' | 'value';
  valueKey: string;
}

const DONUT_RADIUS = 0.6;
/** How far the selected slice pops out, in pixels. */
const EXPLODE = 8;
/** Where the label falls, as a fraction between the hole and the edge. */
const LABEL_AT = 0.62;

/** White or black, whichever reads over the color. An odd color doesn't break: it falls back to `text`. */
function inkOn(background: string, theme: { colors: { white: string; black: string; text: string } }): string {
  try {
    return contrast(background, theme.colors.white) >= contrast(background, theme.colors.black)
      ? theme.colors.white
      : theme.colors.black;
  } catch {
    return theme.colors.text;
  }
}

const PiePlot = memo((props: PiePlotProps) => {
  const { rows, labels, entries, visible, width, height, formatValue, selection, onPick, tooltip, testID, donut, innerRadius, sliceLabels, valueKey } = props;
  const theme = useTheme();
  const surface = useChartSurface();
  const styles = useStyles();
  const allowFontScaling = useAllowFontScaling();

  const center: Point = { x: width / 2, y: height / 2 };
  const radius = Math.max(0, Math.min(width, height) / 2 - 2);
  const hole = clamp(innerRadius ?? (donut ? DONUT_RADIUS : 0), 0, 0.9) * radius;

  const arcs = useMemo(() => {
    // A turned-off category is worth 0: it leaves the pie and the rest share
    // the 100%, which is what whoever turned it off from the legend expects.
    const values = rows.map((row, index) =>
      visible.some((entry) => entry.key === labels[index]) ? (toNumber(row[valueKey]) ?? 0) : 0
    );
    return arcsFor(values);
  }, [rows, labels, visible, valueKey]);

  const pickAt = useCallback(
    (event: GestureResponderEvent) => {
      const point = { x: event?.nativeEvent?.locationX ?? 0, y: event?.nativeEvent?.locationY ?? 0 };
      const distance = Math.hypot(point.x - center.x, point.y - center.y);
      // A donut's hole isn't part of any slice, and neither is the area
      // outside the circle: both release the selection.
      if (distance > radius || distance < hole) return onPick(null);
      const index = arcAt(arcs, angleOf(center, point));
      if (index === -1) return onPick(null);
      onPick({ index, seriesKey: labels[index] ?? '' });
    },
    [center.x, center.y, radius, hole, arcs, labels, onPick]
  );

  const chosen = selection ? arcs.find((arc) => arc.index === selection.index) : undefined;

  return (
    <>
      {arcs.map((arc) => {
        const dim = !!selection && selection.index !== arc.index;
        return (
          <Wedge
            key={arc.index}
            size={radius * 2}
            center={center}
            start={arc.start}
            sweep={arc.sweep}
            color={entries[arc.index]?.color ?? theme.colors.primary}
            opacity={dim ? DIM_OPACITY : 1}
            explode={selection?.index === arc.index ? EXPLODE : 0}
            testID={testID && `${testID}-slice-${arc.index}`}
          />
        );
      })}

      {hole > 0 ? (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: center.x - hole,
            top: center.y - hole,
            width: hole * 2,
            height: hole * 2,
            borderRadius: hole,
            backgroundColor: surface,
          }}
        />
      ) : null}

      {sliceLabels === 'none'
        ? null
        : arcs.map((arc) => {
            // A very thin slice has nowhere to write: the label would spill
            // over its neighbors and none would be readable.
            if (arc.sweep < 18) return null;
            const at = polar(center, hole + (radius - hole) * LABEL_AT, arc.start + arc.sweep / 2);
            const color = entries[arc.index]?.color ?? theme.colors.primary;
            return (
              <Text
                key={arc.index}
                allowFontScaling={allowFontScaling}
                style={[styles.sliceLabel, { left: at.x - 28, top: at.y - 8, width: 56, color: inkOn(color, theme) }]}
                testID={testID && `${testID}-slice-label-${arc.index}`}
              >
                {sliceLabels === 'percent' ? `${Math.round(arc.ratio * 100)}%` : formatValue(arc.value)}
              </Text>
            );
          })}

      <Pressable
        onPress={pickAt}
        accessibilityRole="adjustable"
        accessibilityLabel={arcs.map((arc) => `${labels[arc.index]} ${Math.round(arc.ratio * 100)}%`).join(', ')}
        style={{ position: 'absolute', left: 0, top: 0, width, height }}
        testID={testID && `${testID}-hit`}
      />

      {tooltip && selection && chosen ? (
        <Tooltip
          title={selection.label}
          rows={[
            {
              key: selection.seriesKey,
              label: `${Math.round(chosen.ratio * 100)}%`,
              value: formatValue(selection.value),
              color: entries[selection.index]?.color ?? theme.colors.primary,
            },
          ]}
          anchor={polar(center, radius * 0.9, chosen.start + chosen.sweep / 2)}
          containerWidth={width}
          testID={testID && `${testID}-tooltip`}
        />
      ) : null}
    </>
  );
});
PiePlot.displayName = 'PiePlot';

// ── radar ──────────────────────────────────────────────────────────────────

interface RadarPlotProps extends PlotProps {
  domain?: [number, number] | 'sticky';
  levels: number;
  fill: boolean;
  thickness: number;
  dots: boolean;
}

/** Strips per side of the polygon when it is filled. More = cleaner edge, more views. */
const RADAR_STEPS = 5;
const RADAR_FILL_OPACITY = 0.18;
const RADAR_LABEL_WIDTH = 56;

const RadarPlot = memo((props: RadarPlotProps) => {
  const { rows, labels, visible, width, height, formatValue, selection, onPick, tooltip, testID, domain, levels, fill, thickness, dots } = props;
  const theme = useTheme();
  const surface = useChartSurface();
  const styles = useStyles();
  const allowFontScaling = useAllowFontScaling();

  const center: Point = { x: width / 2, y: height / 2 };
  const radius = Math.max(0, Math.min(width, height) / 2 - RADAR_INSET);
  const angles = useMemo(() => radarAngles(rows.length), [rows.length]);
  const keys = useMemo(() => visible.map((entry) => entry.key), [visible]);

  // The radar measures from the center, and the center is 0: a minimum other
  // than zero would make two similar values look miles apart.
  const measured = useMemo(() => [0, extent(rows, keys, { includeZero: true })[1]] as [number, number], [rows, keys]);
  const [, top] = useDomain(measured, domain);

  const scale = useMemo(() => {
    const nice = Array.isArray(domain) ? exactTicks(0, top, levels) : niceScale(0, top, levels);
    return { nice, toRadius: linearScale([0, nice.max], [0, radius]) };
  }, [domain, top, levels, radius]);

  const pointsOf = useCallback(
    (key: string): Point[] =>
      rows.map((row, index) => polar(center, scale.toRadius(Math.max(0, toNumber(row[key]) ?? 0)), angles[index] ?? 0)),
    [rows, center, scale, angles]
  );

  const pickAt = useCallback(
    (event: GestureResponderEvent) => {
      if (rows.length === 0) return;
      const angle = angleOf(center, { x: event?.nativeEvent?.locationX ?? 0, y: event?.nativeEvent?.locationY ?? 0 });
      const index = Math.round(angle / (360 / rows.length)) % rows.length;
      const key = keys[0] ?? '';
      onPick({ index, seriesKey: key });
    },
    [rows, center, keys, onPick]
  );

  return (
    <>
      <RadarGrid center={center} radius={radius} angles={angles} levels={levels} testID={testID && `${testID}-grid`} />

      {visible.map((entry) => {
        const points = pointsOf(entry.key);
        return (
          <View key={entry.key} style={{ position: 'absolute', left: 0, top: 0, width, height }}>
            {/* Fill: the same sector a pie draws, one per strip of the
                polygon, with the radius that strip gets. */}
            {fill ? (
              // Opacity goes on the group, not on each strip. Per strip, the
              // 0.4° overlap that hides the antialias seam is composited
              // twice and leaves a darker radius at each cut: the fill ends
              // up looking like a spider web. Applied to the group, the strips
              // paint opaque against each other and the whole is dimmed once.
              <View
                pointerEvents="none"
                style={{ position: 'absolute', left: 0, top: 0, width, height, opacity: RADAR_FILL_OPACITY }}
                testID={testID && `${testID}-fill-${entry.key}`}
              >
                {fanStrips(center, points, RADAR_STEPS).map((strip, index) => (
                  <Wedge
                    key={index}
                    size={strip.radius * 2}
                    center={center}
                    start={strip.start}
                    sweep={strip.sweep}
                    color={entry.color}
                  />
                ))}
              </View>
            ) : null}
            <Polyline points={points} color={entry.color} thickness={thickness} closed testID={testID && `${testID}-outline-${entry.key}`} />
            {dots
              ? points.map((point, index) => (
                  <Dot
                    key={index}
                    point={point}
                    color={entry.color}
                    ringColor={surface}
                    size={selection?.index === index ? 8 : 6}
                  />
                ))
              : null}
          </View>
        );
      })}

      {labels.map((label, index) => {
        const at = polar(center, radius + RADAR_INSET / 2, angles[index] ?? 0);
        return (
          <Text
            key={`${label}-${index}`}
            numberOfLines={1}
            allowFontScaling={allowFontScaling}
            style={[
              styles.radarAxisLabel,
              { left: at.x - RADAR_LABEL_WIDTH / 2, top: at.y - 7, width: RADAR_LABEL_WIDTH },
              selection?.index === index && { color: theme.colors.text },
            ]}
            testID={testID && `${testID}-axis-${index}`}
          >
            {label}
          </Text>
        );
      })}

      <Pressable
        onPress={pickAt}
        accessibilityRole="adjustable"
        accessibilityLabel={labels.join(', ')}
        style={{ position: 'absolute', left: 0, top: 0, width, height }}
        testID={testID && `${testID}-hit`}
      />

      {tooltip && selection ? (
        <Tooltip
          title={selection.label}
          rows={tooltipRowsAt(rows, selection.index, visible, formatValue)}
          anchor={polar(center, radius, angles[selection.index] ?? 0)}
          containerWidth={width}
          testID={testID && `${testID}-tooltip`}
        />
      ) : null}
    </>
  );
});
RadarPlot.displayName = 'RadarPlot';
