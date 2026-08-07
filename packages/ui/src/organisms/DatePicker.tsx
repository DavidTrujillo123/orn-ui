import React, { memo, useMemo, useState } from 'react';
import { Text, TouchableOpacity, View, type StyleProp, type ViewStyle } from 'react-native';
import { createStyles } from '../theme/createStyles';
import { useAllowFontScaling, useColors } from '../theme/UIProvider';
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
   * 'single' elige una fecha; 'range' elige un intervalo con dos toques.
   * @default 'single'
   */
  mode?: 'single' | 'range';
  /** Fecha elegida en mode="single". */
  value?: Date;
  /** Se llama en mode="single". */
  onChange?: (date: Date) => void;
  /** Rango elegido en mode="range". */
  range?: DateRange;
  /** Se llama en mode="range", tanto al fijar el inicio como al cerrar el rango. */
  onRangeChange?: (range: DateRange) => void;
  minDate?: Date;
  maxDate?: Date;
  /** Mes mostrado al abrir si no hay `value`. @default hoy */
  defaultMonth?: Date;
  monthNames?: string[];
  weekdayNames?: string[];
  /** 0 = domingo, 1 = lunes. @default 0 */
  firstDayOfWeek?: 0 | 1;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/** Compara sólo año/mes/día, ignorando hora — dos Date del mismo día son "iguales". */
function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** Estrictamente entre start y end, sin incluir los extremos. */
function isBetween(day: Date, start: Date, end: Date): boolean {
  const t = startOfDay(day).getTime();
  return t > startOfDay(start).getTime() && t < startOfDay(end).getTime();
}

function isOutOfRange(day: Date, minDate?: Date, maxDate?: Date): boolean {
  const t = startOfDay(day).getTime();
  if (minDate && t < startOfDay(minDate).getTime()) return true;
  if (maxDate && t > startOfDay(maxDate).getTime()) return true;
  return false;
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
  dayTextSelected: { color: theme.colors.white, fontWeight: theme.tokens.fontWeight.bold },
  // El resaltado del tramo intermedio va en la celda (cuadrada, sin gaps) y
  // no en el botón redondo, así la barra del rango se ve continua.
  cellInRange: { backgroundColor: theme.colors.primary + '1f' },
  cellRangeStart: { borderTopLeftRadius: 18, borderBottomLeftRadius: 18 },
  cellRangeEnd: { borderTopRightRadius: 18, borderBottomRightRadius: 18 },
  dayTextInRange: { color: theme.colors.primary, fontWeight: theme.tokens.fontWeight.semibold },
  dayToday: { borderWidth: 1, borderColor: theme.colors.primary },
  dayTextDisabled: { color: theme.colors.textLight, opacity: 0.4 },
}));

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
    monthNames = DEFAULT_MONTH_NAMES,
    weekdayNames = DEFAULT_WEEKDAY_NAMES,
    firstDayOfWeek = 0,
    style,
    testID,
  }: DatePickerProps) => {
    const colors = useColors();
    const styles = useStyles();
    const allowFontScaling = useAllowFontScaling();
    const isRange = mode === 'range';

    const handlePress = (day: Date) => {
      if (!isRange) {
        onChange?.(day);
        return;
      }
      // Primer toque (o rango ya cerrado, o toque antes del inicio): arranca
      // un rango nuevo. Segundo toque en adelante: lo cierra.
      if (!range?.start || range.end || startOfDay(day) < startOfDay(range.start)) {
        onRangeChange?.({ start: day });
      } else {
        onRangeChange?.({ start: range.start, end: day });
      }
    };

    const initial = value ?? range?.start ?? defaultMonth ?? new Date();
    const [visibleMonth, setVisibleMonth] = useState(() => new Date(initial.getFullYear(), initial.getMonth(), 1));

    const today = useMemo(() => new Date(), []);
    const grid = useMemo(
      () => buildMonthGrid(visibleMonth.getFullYear(), visibleMonth.getMonth(), firstDayOfWeek),
      [visibleMonth, firstDayOfWeek]
    );

    const orderedWeekdays = useMemo(
      () => (firstDayOfWeek === 0 ? weekdayNames : [...weekdayNames.slice(1), weekdayNames[0]!]),
      [weekdayNames, firstDayOfWeek]
    );

    const shiftMonth = (delta: number) =>
      setVisibleMonth((m) => new Date(m.getFullYear(), m.getMonth() + delta, 1));

    const monthLabel = `${monthNames[visibleMonth.getMonth()]} ${visibleMonth.getFullYear()}`;

    return (
      <View style={[styles.container, style]} testID={testID}>
        <View style={styles.header}>
          <IconButton iconName="chevron-left" accessibilityLabel="Previous month" onPress={() => shiftMonth(-1)} />
          <Text allowFontScaling={allowFontScaling} style={styles.monthLabel} accessibilityRole="header">
            {monthLabel}
          </Text>
          <IconButton iconName="chevron-right" accessibilityLabel="Next month" onPress={() => shiftMonth(1)} />
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

              const isStart = isRange && !!range?.start && isSameDay(day, range.start);
              const isEnd = isRange && !!range?.end && isSameDay(day, range.end);
              const inRange =
                isRange && !!range?.start && !!range.end && isBetween(day, range.start, range.end);
              const selected = isRange ? isStart || isEnd : !!value && isSameDay(day, value);

              const disabled = isOutOfRange(day, minDate, maxDate);
              const isToday = isSameDay(day, today);
              return (
                <View
                  style={[
                    styles.cell,
                    (inRange || (isStart && !!range?.end) || isEnd) && styles.cellInRange,
                    isStart && !!range?.end && styles.cellRangeStart,
                    isEnd && styles.cellRangeEnd,
                  ]}
                  key={cellIndex}
                >
                  <TouchableOpacity
                    style={[styles.dayButton, selected && styles.daySelected, !selected && isToday && styles.dayToday]}
                    onPress={() => handlePress(day)}
                    disabled={disabled}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel={`${monthNames[day.getMonth()]} ${day.getDate()}, ${day.getFullYear()}`}
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
              );
            })}
          </View>
        ))}
      </View>
    );
  }
);
DatePicker.displayName = 'DatePicker';
