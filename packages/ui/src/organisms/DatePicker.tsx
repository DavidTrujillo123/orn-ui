import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Text, TouchableOpacity, View, type StyleProp, type ViewStyle } from 'react-native';
import { createStyles } from '../theme/createStyles';
import { useAllowFontScaling, useLabels } from '../theme/UIProvider';
import { IconButton } from '../atoms/IconButton';

export const DEFAULT_MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** Índice 0 = domingo, para alinear con Date.getDay(). */
export const DEFAULT_WEEKDAY_NAMES = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export interface DateRange {
  start: Date;
  /** Falta mientras el rango está a medio elegir (sólo se tocó el inicio). */
  end?: Date;
}

export interface DatePickerProps {
  /**
   * 'single' picks one date; 'range' picks an interval with two taps.
   * @default 'single'
   */
  mode?: 'single' | 'range';
  /** Selected date in mode="single". */
  value?: Date;
  /** Called in mode="single". */
  onChange?: (date: Date) => void;
  /** Selected range in mode="range". */
  range?: DateRange;
  /** Called in mode="range", both when setting the start and when closing the range. */
  onRangeChange?: (range: DateRange) => void;
  minDate?: Date;
  maxDate?: Date;
  /** Month shown on open if there's no `value`. @default today */
  defaultMonth?: Date;
  /** Month names. @default those from `useLabels()` */
  monthNames?: string[];
  /** Day initials, index 0 = Sunday. @default those from `useLabels()` */
  weekdayNames?: string[];
  /** 0 = Sunday, 1 = Monday. @default 0 */
  firstDayOfWeek?: 0 | 1;
  /** Reports which month became visible when navigating with the arrows. */
  onVisibleMonthChange?: (month: Date) => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** Timestamp del día, para comparar sin volver a crear Date en cada celda. */
function dayTime(d: Date): number {
  return startOfDay(d).getTime();
}

function dayTimeOf(d: Date | undefined): number | undefined {
  return d ? dayTime(d) : undefined;
}

/** Milisegundos que faltan para la próxima medianoche local. */
function msUntilNextMidnight(from: Date): number {
  const next = new Date(from.getFullYear(), from.getMonth(), from.getDate() + 1);
  return next.getTime() - from.getTime();
}

/** Número de mes absoluto (año * 12 + mes), para comparar meses con un `<`. */
function monthIndex(d: Date): number {
  return d.getFullYear() * 12 + d.getMonth();
}

/**
 * Devuelve la grilla del mes: 6 filas de 7 celdas. Las celdas fuera del mes
 * son null, así el layout no salta de alto entre meses (un mes puede
 * necesitar 4, 5 o 6 filas según en qué día caiga el 1).
 */
export function buildMonthGrid(year: number, month: number, firstDayOfWeek: 0 | 1): (Date | null)[][] {
  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leading = (first.getDay() - firstDayOfWeek + 7) % 7;

  const cells: (Date | null)[] = [];
  for (let i = 0; i < leading; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  while (cells.length < 42) cells.push(null);

  const rows: (Date | null)[][] = [];
  for (let r = 0; r < 6; r++) rows.push(cells.slice(r * 7, r * 7 + 7));
  return rows;
}

const useStyles = createStyles((theme) => ({
  container: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.tokens.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.tokens.spacing.md,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: theme.tokens.spacing.sm },
  monthLabel: { fontSize: theme.tokens.fontSize.lg, fontWeight: theme.tokens.fontWeight.semibold, color: theme.colors.text },
  weekRow: { flexDirection: 'row' },
  weekday: {
    flex: 1,
    textAlign: 'center',
    fontSize: theme.tokens.fontSize.xs,
    fontWeight: theme.tokens.fontWeight.semibold,
    color: theme.colors.textLight,
    paddingVertical: theme.tokens.spacing.sm,
  },
  row: { flexDirection: 'row' },
  cell: { flex: 1, aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  dayButton: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  dayText: { fontSize: theme.tokens.fontSize.md, color: theme.colors.text },
  daySelected: { backgroundColor: theme.colors.primary },
  dayTextSelected: { color: theme.colors.onPrimary, fontWeight: theme.tokens.fontWeight.bold },
  // El resaltado del tramo intermedio va en la celda (cuadrada, sin gaps) y
  // no en el botón redondo, así la barra del rango se ve continua.
  cellInRange: { backgroundColor: theme.colors.primarySoft },
  cellRangeStart: { borderTopLeftRadius: 18, borderBottomLeftRadius: 18 },
  cellRangeEnd: { borderTopRightRadius: 18, borderBottomRightRadius: 18 },
  dayTextInRange: { color: theme.colors.primaryText, fontWeight: theme.tokens.fontWeight.semibold },
  dayToday: { borderWidth: 1, borderColor: theme.colors.primary },
  dayTextDisabled: { color: theme.colors.textLight, opacity: 0.4 },
}));

type Styles = ReturnType<typeof useStyles>;

interface DayCellProps {
  day: Date;
  label: string;
  selected: boolean;
  inRange: boolean;
  isRangeStart: boolean;
  isRangeEnd: boolean;
  isToday: boolean;
  disabled: boolean;
  allowFontScaling: boolean;
  styles: Styles;
  onPress: (day: Date) => void;
}

/**
 * Una celda del calendario. Va memoizada aparte porque el mes entero son 42
 * celdas: sin esto, cualquier render del padre reconcilia las 42.
 */
const DayCell = memo(
  ({
    day,
    label,
    selected,
    inRange,
    isRangeStart,
    isRangeEnd,
    isToday,
    disabled,
    allowFontScaling,
    styles,
    onPress,
  }: DayCellProps) => (
    <View
      style={[
        styles.cell,
        (inRange || isRangeStart || isRangeEnd) && styles.cellInRange,
        isRangeStart && styles.cellRangeStart,
        isRangeEnd && styles.cellRangeEnd,
      ]}
    >
      <TouchableOpacity
        style={[styles.dayButton, selected && styles.daySelected, !selected && isToday && styles.dayToday]}
        onPress={() => onPress(day)}
        disabled={disabled}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ selected, disabled }}
      >
        <Text
          allowFontScaling={allowFontScaling}
          style={[
            styles.dayText,
            inRange && styles.dayTextInRange,
            selected && styles.dayTextSelected,
            disabled && styles.dayTextDisabled,
          ]}
        >
          {day.getDate()}
        </Text>
      </TouchableOpacity>
    </View>
  )
);
DayCell.displayName = 'DayCell';

/**
 * DatePicker
 * Calendario mensual dibujado con View/Text puros — sin
 * @react-native-community/datetimepicker ni ningún picker nativo, para
 * mantener la librería en cero dependencias y verse igual en iOS y Android.
 */
export const DatePicker = memo(
  ({
    mode = 'single',
    value,
    onChange,
    range,
    onRangeChange,
    minDate,
    maxDate,
    defaultMonth,
    monthNames,
    weekdayNames,
    firstDayOfWeek = 0,
    onVisibleMonthChange,
    style,
    testID,
  }: DatePickerProps) => {
    const styles = useStyles();
    const labels = useLabels();
    const allowFontScaling = useAllowFontScaling();
    const isRange = mode === 'range';

    const months = monthNames ?? labels.months;
    const weekdays = weekdayNames ?? labels.weekdaysShort;

    const handlePress = useCallback(
      (day: Date) => {
        if (!isRange) {
          onChange?.(day);
          return;
        }
        // Primer toque (o rango ya cerrado, o toque antes del inicio): arranca
        // un rango nuevo. Segundo toque en adelante: lo cierra.
        if (!range?.start || range.end || dayTime(day) < dayTime(range.start)) {
          onRangeChange?.({ start: day });
        } else {
          onRangeChange?.({ start: range.start, end: day });
        }
      },
      [isRange, onChange, onRangeChange, range?.start, range?.end]
    );

    const anchor = value ?? range?.start ?? defaultMonth;
    const [visibleMonth, setVisibleMonth] = useState(
      () => new Date((anchor ?? new Date()).getFullYear(), (anchor ?? new Date()).getMonth(), 1)
    );

    // La fecha elegida puede cambiar desde afuera (uso controlado): sin esto,
    // el calendario se quedaba clavado en el mes con el que montó.
    const anchorMonth = anchor ? monthIndex(anchor) : undefined;
    const lastAnchorMonth = useRef(anchorMonth);
    useEffect(() => {
      if (anchorMonth === undefined || anchorMonth === lastAnchorMonth.current) return;
      lastAnchorMonth.current = anchorMonth;
      setVisibleMonth(new Date(Math.floor(anchorMonth / 12), anchorMonth % 12, 1));
    }, [anchorMonth]);

    // "Hoy" se recalcula en la próxima medianoche: una app que queda abierta
    // toda la noche marcaba el día anterior.
    const [todayTs, setTodayTs] = useState(() => dayTime(new Date()));
    useEffect(() => {
      const timer = setTimeout(() => setTodayTs(dayTime(new Date())), msUntilNextMidnight(new Date()));
      return () => clearTimeout(timer);
    }, [todayTs]);

    const grid = useMemo(
      () => buildMonthGrid(visibleMonth.getFullYear(), visibleMonth.getMonth(), firstDayOfWeek),
      [visibleMonth, firstDayOfWeek]
    );

    const orderedWeekdays = useMemo(
      () => (firstDayOfWeek === 0 ? weekdays : [...weekdays.slice(1), weekdays[0]!]),
      [weekdays, firstDayOfWeek]
    );

    // Los límites se resuelven una vez y no 42 veces por render: comparar
    // timestamps sale gratis, crear un Date por celda no.
    const bounds = useMemo(
      () => ({
        min: dayTimeOf(minDate),
        max: dayTimeOf(maxDate),
        start: dayTimeOf(range?.start),
        end: dayTimeOf(range?.end),
        selected: dayTimeOf(value),
      }),
      [minDate, maxDate, range?.start, range?.end, value]
    );

    const shiftMonth = (delta: number) =>
      setVisibleMonth((m) => {
        const next = new Date(m.getFullYear(), m.getMonth() + delta, 1);
        onVisibleMonthChange?.(next);
        return next;
      });

    // Un mes entero fuera de los límites no tiene nada que elegir: la flecha
    // que lleva ahí se apaga en vez de dejar navegar al vacío.
    const visibleIndex = monthIndex(visibleMonth);
    const canGoBack = !minDate || visibleIndex > monthIndex(minDate);
    const canGoForward = !maxDate || visibleIndex < monthIndex(maxDate);

    const monthLabel = `${months[visibleMonth.getMonth()]} ${visibleMonth.getFullYear()}`;

    return (
      <View style={[styles.container, style]} testID={testID}>
        <View style={styles.header}>
          <IconButton
            iconName="chevron-left"
            accessibilityLabel="Previous month"
            disabled={!canGoBack}
            onPress={() => shiftMonth(-1)}
          />
          <Text allowFontScaling={allowFontScaling} style={styles.monthLabel} accessibilityRole="header">
            {monthLabel}
          </Text>
          <IconButton
            iconName="chevron-right"
            accessibilityLabel="Next month"
            disabled={!canGoForward}
            onPress={() => shiftMonth(1)}
          />
        </View>

        <View style={styles.weekRow}>
          {orderedWeekdays.map((w, i) => (
            <Text allowFontScaling={allowFontScaling} key={`${w}-${i}`} style={styles.weekday}>
              {w}
            </Text>
          ))}
        </View>

        {grid.map((row, rowIndex) => (
          <View style={styles.row} key={rowIndex}>
            {row.map((day, cellIndex) => {
              if (!day) return <View style={styles.cell} key={cellIndex} />;

              const t = dayTime(day);
              const disabled = (bounds.min !== undefined && t < bounds.min) || (bounds.max !== undefined && t > bounds.max);
              const isStart = isRange && bounds.start === t;
              const isEnd = isRange && bounds.end === t;
              const closed = isRange && bounds.start !== undefined && bounds.end !== undefined;
              const between = closed && t > bounds.start! && t < bounds.end!;
              const selected = isRange ? isStart || isEnd : bounds.selected === t;

              return (
                <DayCell
                  key={cellIndex}
                  day={day}
                  label={`${months[day.getMonth()]} ${day.getDate()}, ${day.getFullYear()}`}
                  selected={selected}
                  // Un día fuera de los límites no se pinta como parte del
                  // rango: se ve deshabilitado, y eso es lo que es.
                  inRange={between && !disabled}
                  isRangeStart={!!closed && isStart && !disabled}
                  isRangeEnd={isEnd && !disabled}
                  isToday={t === todayTs}
                  disabled={disabled}
                  allowFontScaling={allowFontScaling}
                  styles={styles}
                  onPress={handlePress}
                />
              );
            })}
          </View>
        ))}
      </View>
    );
  }
);
DatePicker.displayName = 'DatePicker';
