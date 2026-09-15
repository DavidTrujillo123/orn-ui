import React, { memo, useCallback, useMemo, useRef, useState } from 'react';
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
  /** Columna de `data` que lee esta serie. */
  key: string;
  /** Lo que dicen la leyenda y el tooltip. Por defecto, `key`. */
  label?: string;
  /** Pisa el color derivado del theme. */
  color?: string;
}

export interface ChartFilterOption {
  value: string;
  label: string;
}

/**
 * Un filtro de la barra superior. Chart no filtra nada por su cuenta: muestra
 * el control y avisa. Quien tiene los datos decide qué significa "últimos 7
 * días", y eso no se puede adivinar desde acá.
 */
export interface ChartFilter {
  key: string;
  options: ChartFilterOption[];
  value: string;
  onChange: (value: string) => void;
}

export interface ChartSelection {
  /**
   * Identidad de la fila, estable a través de un `window` o un diezmado.
   * Sale de `selectBy`; sin él es el índice, y entonces no sobrevive a que
   * los datos corran.
   */
  id: string;
  /**
   * Índice adentro de las filas **dibujadas**, no de `data`: con `window` o
   * con diezmado no son la misma lista. Para volver al dato está `row`.
   */
  index: number;
  /** La fila entera, sin tener que resolver el índice contra nada. */
  row: ChartRow;
  /** Valor de `xKey` en esa fila. */
  label: string;
  /** Serie tocada. En torta es la fila, que ahí es la categoría. */
  seriesKey: string;
  value: number;
}

interface ChartBaseProps {
  data: ChartRow[];
  /**
   * Series a dibujar. En 'pie'/'donut' sólo se usa la primera: las categorías
   * de una torta son las filas, no las columnas.
   */
  series: ChartSeries[];
  /** Columna con la etiqueta de cada fila. @default 'x' */
  xKey?: string;
  /**
   * Identidad estable de una fila. Sin esto la selección se guarda por índice,
   * y en una ventana deslizante el índice corre: el punto resaltado pasa a
   * señalar otro dato sin que nadie lo toque. Con esto el resaltado sigue al
   * dato, y desaparece solo cuando el dato sale de la ventana.
   */
  selectBy?: (row: ChartRow, index: number) => string;
  /**
   * Dibuja sólo las últimas N filas. Es la ventana deslizante de un chart en
   * vivo: quien empuja los datos no tiene que recortarlos en cada tick.
   */
  window?: number;
  /** Alto del área de dibujo, sin contar filtros ni leyenda. @default 220 */
  height?: number;
  /**
   * 'toggle' convierte la leyenda en el filtro más barato que tiene un chart:
   * tocar una serie la apaga. @default 'auto' (toggle con 2+ series, none con una)
   */
  legend?: 'auto' | 'none' | 'static' | 'toggle';
  /** Series apagadas, controlado. Sin esto, Chart se las acuerda solo. */
  hiddenKeys?: string[];
  /** @default [] */
  defaultHiddenKeys?: string[];
  onHiddenKeysChange?: (keys: string[]) => void;
  /** Controles arriba del chart, uno por filtro. */
  filters?: ChartFilter[];
  /** Punto resaltado, controlado. `null` es "ninguno". */
  selected?: ChartSelection | null;
  onSelect?: (selection: ChartSelection | null) => void;
  /** Globo con los valores de la categoría tocada. @default true */
  tooltip?: boolean;
  /** @default formato compacto: 1.2k, 3.4M */
  formatValue?: (value: number) => string;
  /** @default true */
  animate?: boolean;
  /** ms de la animación de las marcas. @default tokens.duration.slow * 2 */
  duration?: number;
  /** Texto cuando no queda nada que dibujar. */
  emptyText?: string;
  /** Obligatorio: un chart no tiene texto que lo describa. */
  accessibilityLabel: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

interface CartesianProps {
  /**
   * Fija el eje de valores. Por defecto se recalcula con cada dato, que es lo
   * correcto para un chart estático y lo peor para uno en vivo: llega un valor
   * más alto, la escala entera se reacomoda y la línea salta aunque el dato no
   * se haya movido.
   *
   * - `[min, max]` — exacto, sin redondear a números lindos.
   * - `'sticky'` — arranca del dato y crece cuando algo no entra, pero no se
   *   vuelve a achicar.
   */
  domain?: [number, number] | 'sticky';
  /** Líneas de referencia del eje de valores. @default true */
  grid?: boolean;
  /** Ticks buscados en el eje de valores; el redondeo puede dar uno más o uno menos. @default 4 */
  ticks?: number;
  /** Etiquetas del eje horizontal. @default true */
  xAxis?: boolean;
  /** Etiquetas del eje vertical. @default true */
  yAxis?: boolean;
}

interface BarChartProps extends CartesianProps {
  type: 'bar';
  /** 'horizontal' pone las categorías en el eje vertical. @default 'vertical' */
  orientation?: 'vertical' | 'horizontal';
  /** Apila las series en vez de ponerlas lado a lado. @default false */
  stacked?: boolean;
  /** Radio del extremo libre de cada barra. @default radius.xs */
  barRadius?: number;
}

interface LineChartProps extends CartesianProps {
  type: 'line';
  /**
   * Cuántos puntos dibujar como mucho, eligiéndolos con LTTB. Por defecto sale
   * del ancho medido: más de un punto cada dos píxeles no se ve y sí se paga.
   * `false` los dibuja todos.
   */
  decimate?: number | false;
  /** Catmull-Rom en vez de tramos rectos. @default false */
  smooth?: boolean;
  /** @default 2 */
  thickness?: number;
  /** Punto en cada dato. @default true */
  dots?: boolean;
}

interface AreaChartProps extends CartesianProps {
  type: 'area';
  /** Igual que en 'line'. */
  decimate?: number | false;
  smooth?: boolean;
  thickness?: number;
  /** @default false */
  dots?: boolean;
  /** @default false */
  stacked?: boolean;
  /** Opacidad del relleno bajo la línea. @default 0.22 */
  fillOpacity?: number;
}

interface PieBaseProps {
  /** Agujero como fracción del radio, 0–0.9. @default 0 en 'pie', 0.6 en 'donut' */
  innerRadius?: number;
  /** Qué escribir sobre cada porción. @default 'percent' */
  sliceLabels?: 'none' | 'percent' | 'value';
}

// 'pie' y 'donut' van separados aunque compartan todo: con un solo miembro
// cuyo `type` fuera `'pie' | 'donut'`, TypeScript no saca ese miembro de la
// unión al descartarlo, y el resto del componente deja de estrecharse.
interface PieChartProps extends PieBaseProps {
  type: 'pie';
}

interface DonutChartProps extends PieBaseProps {
  type: 'donut';
}

interface RadarChartProps {
  type: 'radar';
  /**
   * Fija el alcance de los ejes. El radar mide desde el centro, así que el
   * mínimo es siempre 0 y de `[min, max]` sólo se usa `max`.
   */
  domain?: [number, number] | 'sticky';
  /** Anillos de la telaraña. @default 4 */
  levels?: number;
  /** Rellena el polígono además de dibujar su contorno. @default true */
  fill?: boolean;
  thickness?: number;
  /** @default true */
  dots?: boolean;
}

export type ChartProps = ChartBaseProps &
  (BarChartProps | LineChartProps | AreaChartProps | PieChartProps | DonutChartProps | RadarChartProps);

const DEFAULT_HEIGHT = 220;
const DEFAULT_TICKS = 4;
/** Piso del canal de las etiquetas de valor, a la izquierda. */
const VALUE_GUTTER = 38;
/**
 * Ancho estimado de un caracter de etiqueta. React Native no mide texto sin
 * renderizarlo, y medir para decidir el layout haría aparecer el chart
 * corrido un frame; a `fontSize.xs` un dígito ronda 0.6em, y de más es mejor
 * que de menos — sobra aire, no se corta el número.
 */
const VALUE_CHAR = 6.5;
/** Tope del canal: un eje ancho no puede comerse el plot. */
const VALUE_GUTTER_MAX = 0.3;
/** Canal de las categorías cuando van a la izquierda (barras horizontales). */
const CATEGORY_GUTTER = 64;
/** Canal de las etiquetas de abajo. */
const BOTTOM_GUTTER = 16;
/** Fracción del ancho de banda que ocupan las barras; el resto es aire. */
const BAND_FILL = 0.7;
/** Aire alrededor del radar para que entren las etiquetas de los ejes. */
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

/** Estado controlado o propio, con el mismo contrato en los dos casos. */
function useControlled<T>(controlled: T | undefined, fallback: T): [T, (next: T) => void, boolean] {
  const [own, setOwn] = useState(fallback);
  const isControlled = controlled !== undefined;
  return [isControlled ? (controlled as T) : own, setOwn, isControlled];
}

/**
 * Resuelve el dominio del eje de valores a partir de lo que pidió el
 * consumidor. En 'sticky' la referencia vive en un ref: lo que importa no es
 * el dominio de este render sino el más ancho que se haya visto, y guardarlo
 * en estado dispararía un render de más por cada tick que ensancha el eje.
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
 * Barras (verticales, horizontales, agrupadas, apiladas), línea, área, torta,
 * dona y radar en un solo componente, porque lo que cambia entre ellos es la
 * marca que se dibuja y no el resto: datos, escala, ejes, leyenda, tooltip,
 * selección y filtros son los mismos seis mecanismos en todos.
 *
 * Se dibuja con `View`: React Native no trae lienzo vectorial y la librería no
 * puede agregar uno. Las tres primitivas están en `chart/marks.tsx` y la
 * geometría entera, sin React, en `chart/math.ts`.
 *
 * Gestalt: destino común — al tocar una categoría, todo lo que no es ella baja
 * a {@link DIM_OPACITY} a la vez, así que lo resaltado se lee como un grupo y
 * no como una marca suelta. La leyenda usa similitud: el mismo color que la
 * serie, y por eso puede apagarla sin que haga falta explicar qué apaga.
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
    animate = true,
    duration,
    emptyText,
    accessibilityLabel,
    style,
    testID,
  } = props;

  const theme = useTheme();
  const styles = useStyles();
  const allowFontScaling = useAllowFontScaling();
  const uiLabels = useLabels();
  const [width, setWidth] = useState(0);

  const [hidden, setHidden, hiddenIsControlled] = useControlled(hiddenKeys, defaultHiddenKeys ?? []);
  const [pick, setPick, selectionIsControlled] = useControlled<ChartSelection | null>(selected, null);

  const isPie = props.type === 'pie' || props.type === 'donut';
  const polyline = props.type === 'line' || props.type === 'area';
  const decimate = polyline ? props.decimate : false;

  /**
   * Lo que se dibuja: la ventana de `data`, y de ahí los puntos que caben.
   * El diezmado corre sobre la fila entera, elegida con la primera serie
   * visible: las series comparten eje x, así que quedarse con índices
   * distintos por serie rompería la alineación, la capa de toque y el tooltip.
   */
  const rows = useMemo(() => {
    const windowed = windowSize && windowSize > 0 ? data.slice(-windowSize) : data;
    if (!polyline || decimate === false || width === 0) return windowed;
    // Un punto cada dos píxeles: más no se ve y sí se paga.
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
   * La selección se guarda por `id` y se resuelve contra las filas de ahora:
   * si el dato se corrió, el resaltado lo sigue; si salió de la ventana,
   * desaparece. Reusar el índice a ciegas señalaría el dato que quedó en ese
   * lugar, que no es el que nadie eligió.
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

  // En torta las categorías son las filas; en el resto, las columnas. De eso
  // dependen el color, la leyenda y qué apaga un toque en ella.
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
   * Los plots avisan qué se tocó —fila y serie— y la selección entera se
   * arma acá: es el único lugar que conoce `selectBy`, las etiquetas y las
   * filas de verdad, y así los tres no repiten el armado.
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
      // Tocar lo ya elegido lo suelta: sin eso no habría forma de volver al
      // chart entero sin tocar afuera, y "afuera" en una pantalla con scroll
      // no siempre existe.
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
  );
}

Chart.displayName = 'Chart';

// ── lo que comparten los tres plots ────────────────────────────────────────

interface PlotProps {
  rows: ChartRow[];
  labels: string[];
  /** Todas las categorías, con su color: el color no cambia al apagar una. */
  entries: LegendItem[];
  /** Las que quedaron prendidas. */
  visible: LegendItem[];
  width: number;
  height: number;
  formatValue: (value: number) => string;
  animate: boolean;
  duration: number;
  selection: ChartSelection | null;
  /** Avisa qué se tocó; Chart arma la selección. `null` la suelta. */
  onPick: (hit: { index: number; seriesKey: string } | null) => void;
  tooltip: boolean;
  testID?: string;
}

/** Filas del tooltip para una categoría del eje x. */
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

// ── barras, línea y área ───────────────────────────────────────────────────

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

/** Ancho de una tira del relleno de área, en píxeles. Más fino = más vistas. */
const STRIP_WIDTH = 4;
const MAX_STRIPS = 140;
/** Aire entre dos barras del mismo grupo. */
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
  const horizontal = type === 'bar' && orientation === 'horizontal';
  const keys = useMemo(() => visible.map((entry) => entry.key), [visible]);

  const bottomGutter = xAxis ? BOTTOM_GUTTER : 0;

  // La línea puede no tocar el cero (una temperatura, un ranking); una barra
  // sí tiene que hacerlo, porque su largo es el que dice el valor.
  const measured = useMemo(
    () => extent(rows, keys, { stacked, includeZero: type !== 'line' }),
    [rows, keys, stacked, type]
  );
  const [low, high] = useDomain(measured, domain);

  // Un dominio a mano se respeta tal cual; uno medido (o 'sticky') se
  // redondea, que es lo que hace legible el eje.
  const nice = useMemo(
    () => (Array.isArray(domain) ? exactTicks(low, high, tickCount) : niceScale(low, high, tickCount)),
    [domain, low, high, tickCount]
  );

  /**
   * El canal sale de la etiqueta más larga, no de una constante: con un
   * `formatValue` propio ("$3000", "1.250 ms") un ancho fijo corta el número
   * y el eje pasa a decir "$30…". Los ticks no dependen del ancho del plot,
   * así que se pueden medir antes de repartirlo.
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

  /** Puntos de una serie: `to` es el valor, `from` el piso desde donde se rellena. */
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
      // Sobre qué serie cayó el dedo: la que tiene su marca más cerca del
      // toque en el eje de valores. Con una sola serie es siempre esa.
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
      {/* Marco: grilla y etiquetas, por debajo de las marcas. */}
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
                  {/* Área: sin `path` no hay relleno bajo una curva, así que se
                      corta en tiras verticales y cada una pregunta su alto a la
                      polilínea. A 4px por tira el borde ya se lee como continuo. */}
                  {type === 'area' ? (
                    // La opacidad va en el grupo, no en cada tira: el medio
                    // píxel de solape que tapa la costura del antialias se
                    // compone dos veces y deja una raya vertical cada cuatro
                    // píxeles. Atenuado el grupo entero, se pinta una sola vez.
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
                          ringColor={theme.colors.surface}
                          size={selection?.index === index ? 8 : 6}
                          testID={testID && `${testID}-dot-${entry.key}-${index}`}
                        />
                      ))
                    : null}
                </View>
              );
            })}

        {/* Capa de toque: una banda entera por categoría. Tocar una línea de
            2px es imposible; tocar su columna, no. */}
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

// ── torta y dona ───────────────────────────────────────────────────────────

interface PiePlotProps extends PlotProps {
  donut: boolean;
  innerRadius?: number;
  sliceLabels: 'none' | 'percent' | 'value';
  valueKey: string;
}

const DONUT_RADIUS = 0.6;
/** Cuánto sale la porción elegida, en píxeles. */
const EXPLODE = 8;
/** Dónde cae la etiqueta, como fracción entre el agujero y el borde. */
const LABEL_AT = 0.62;

/** Blanco o negro, el que se lea encima del color. Un color raro no rompe: cae en `text`. */
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
  const styles = useStyles();
  const allowFontScaling = useAllowFontScaling();

  const center: Point = { x: width / 2, y: height / 2 };
  const radius = Math.max(0, Math.min(width, height) / 2 - 2);
  const hole = clamp(innerRadius ?? (donut ? DONUT_RADIUS : 0), 0, 0.9) * radius;

  const arcs = useMemo(() => {
    // Una categoría apagada vale 0: sale de la torta y el resto se reparte el
    // 100%, que es lo que espera quien la apagó desde la leyenda.
    const values = rows.map((row, index) =>
      visible.some((entry) => entry.key === labels[index]) ? (toNumber(row[valueKey]) ?? 0) : 0
    );
    return arcsFor(values);
  }, [rows, labels, visible, valueKey]);

  const pickAt = useCallback(
    (event: GestureResponderEvent) => {
      const point = { x: event?.nativeEvent?.locationX ?? 0, y: event?.nativeEvent?.locationY ?? 0 };
      const distance = Math.hypot(point.x - center.x, point.y - center.y);
      // El agujero de una dona no es parte de ninguna porción, y afuera del
      // círculo tampoco: los dos sueltan la selección.
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
            backgroundColor: theme.colors.surface,
          }}
        />
      ) : null}

      {sliceLabels === 'none'
        ? null
        : arcs.map((arc) => {
            // Una porción muy fina no tiene dónde escribir: la etiqueta se
            // saldría encima de las vecinas y no se leería ninguna.
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

/** Tiras por lado del polígono cuando se rellena. Más = borde más limpio, más vistas. */
const RADAR_STEPS = 5;
const RADAR_FILL_OPACITY = 0.18;
const RADAR_LABEL_WIDTH = 56;

const RadarPlot = memo((props: RadarPlotProps) => {
  const { rows, labels, visible, width, height, formatValue, selection, onPick, tooltip, testID, domain, levels, fill, thickness, dots } = props;
  const theme = useTheme();
  const styles = useStyles();
  const allowFontScaling = useAllowFontScaling();

  const center: Point = { x: width / 2, y: height / 2 };
  const radius = Math.max(0, Math.min(width, height) / 2 - RADAR_INSET);
  const angles = useMemo(() => radarAngles(rows.length), [rows.length]);
  const keys = useMemo(() => visible.map((entry) => entry.key), [visible]);

  // El radar mide desde el centro, y el centro es 0: un mínimo distinto de
  // cero haría que dos valores parecidos se vean lejísimos.
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
            {/* Relleno: el mismo sector que dibuja una torta, uno por tira del
                polígono, con el radio que le toca a esa tira. */}
            {fill ? (
              // La opacidad va en el grupo, no en cada tira. Por tira, el
              // solape de 0.4° que tapa la costura del antialias se compone
              // dos veces y deja un radio más oscuro por corte: el relleno
              // termina pareciendo una telaraña. Aplicada al grupo, las tiras
              // se pintan opacas entre sí y el conjunto se atenúa una vez.
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
                    ringColor={theme.colors.surface}
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
