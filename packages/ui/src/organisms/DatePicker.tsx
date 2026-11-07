import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Text, TouchableOpacity, View, type StyleProp, type ViewStyle } from 'react-native';
import { createStyles } from '../theme/createStyles';
import { useAllowFontScaling, useLabels } from '../theme/UIProvider';
import { IconButton } from '../atoms/IconButton';

export const DEFAULT_MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** Index 0 = Sunday, to line up with Date.getDay(). */
export const DEFAULT_WEEKDAY_NAMES = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export interface DateRange {
  start: Date;
  /** Missing while the range is half-picked (only the start was tapped). */
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
  /** Earliest selectable day; earlier days are dimmed and the back arrow stops there. */
  minDate?: Date;
  /** Latest selectable day; later days are dimmed and the forward arrow stops there. */
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

/** The day's timestamp, to compare without creating a Date again in each cell. */
function dayTime(d: Date): number {
  return startOfDay(d).getTime();
}

function dayTimeOf(d: Date | undefined): number | undefined {
  return d ? dayTime(d) : undefined;
}

/** Milliseconds left until the next local midnight. */
function msUntilNextMidnight(from: Date): number {
  const next = new Date(from.getFullYear(), from.getMonth(), from.getDate() + 1);
  return next.getTime() - from.getTime();
}

/** Absolute month number (year * 12 + month), to compare months with a `<`. */
function monthIndex(d: Date): number {
  return d.getFullYear() * 12 + d.getMonth();
}

/**
 * Returns the month grid: 6 rows of 7 cells. Cells outside the month are
 * null, so the layout doesn't jump in height between months (a month can
 * need 4, 5 or 6 rows depending on which day the 1st falls on).
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

/** Drawn size of a day; hitSlop takes the touch target to 44pt (Fitts). */
const DAY_SIZE = 36;
const MIN_TOUCH = 44;
const DAY_HIT_SLOP = (MIN_TOUCH - DAY_SIZE) / 2;
const DAY_HIT = { top: DAY_HIT_SLOP, bottom: DAY_HIT_SLOP, left: DAY_HIT_SLOP, right: DAY_HIT_SLOP };

const useStyles = createStyles((theme) => ({
  container: {
    // Raised, like Card: in dark the calendar reads as a panel, not only as a border.
    backgroundColor: theme.colors.surfaceRaised,
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
  dayButton: { width: DAY_SIZE, height: DAY_SIZE, borderRadius: DAY_SIZE / 2, alignItems: 'center', justifyContent: 'center' },
  dayText: { fontSize: theme.tokens.fontSize.md, color: theme.colors.text },
  daySelected: { backgroundColor: theme.colors.primary },
  dayTextSelected: { color: theme.colors.onPrimary, fontWeight: theme.tokens.fontWeight.bold },
  // The highlight of the in-between stretch goes on the cell (square, no gaps)
  // and not on the round button, so the range bar looks continuous.
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
 * A calendar cell. It is memoized separately because the whole month is 42
 * cells: without this, any parent render reconciles all 42.
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
        activeOpacity={PRESSED_OPACITY}
        hitSlop={DAY_HIT}
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
 * Monthly calendar drawn with plain View/Text — without
 * @react-native-community/datetimepicker or any native picker, to keep the
 * library at zero dependencies and look the same on iOS and Android.
 *
 * Gestalt, common region and alignment: 6 rows of 7 cells always (the grid
 * never jumps between months), weekdays aligned over their column. Similarity:
 * every day is the same circle; state changes only fill and color (selected
 * filled, today outlined, out of range dimmed). Continuity: a range is one
 * band from start to end, not separate dots. Fitts: each day reaches a 44pt touch target (36pt circle + hitSlop).
 *
 * Accessibility: the month is a header, each day reads its full date, and the
 * arrows' names come from `labels` (`previousMonth`, `nextMonth`).
 */
const PRESSED_OPACITY = 0.7;

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
        // First tap (or range already closed, or a tap before the start): starts
        // a new range. Second tap onward: closes it.
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

    // The selected date can change from outside (controlled use): without this,
    // the calendar stayed stuck on the month it mounted with.
    const anchorMonth = anchor ? monthIndex(anchor) : undefined;
    const lastAnchorMonth = useRef(anchorMonth);
    useEffect(() => {
      if (anchorMonth === undefined || anchorMonth === lastAnchorMonth.current) return;
      lastAnchorMonth.current = anchorMonth;
      setVisibleMonth(new Date(Math.floor(anchorMonth / 12), anchorMonth % 12, 1));
    }, [anchorMonth]);

    // "Today" is recalculated at the next midnight: an app left open all
    // night marked the previous day.
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

    // The limits are resolved once and not 42 times per render: comparing
    // timestamps is free, creating a Date per cell isn't.
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

    // A month entirely outside the limits has nothing to pick: the arrow
    // leading there turns off instead of letting you navigate into the void.
    const visibleIndex = monthIndex(visibleMonth);
    const canGoBack = !minDate || visibleIndex > monthIndex(minDate);
    const canGoForward = !maxDate || visibleIndex < monthIndex(maxDate);

    const monthLabel = `${months[visibleMonth.getMonth()]} ${visibleMonth.getFullYear()}`;

    return (
      <View style={[styles.container, style]} testID={testID}>
        <View style={styles.header}>
          <IconButton
            iconName="chevron-left"
            accessibilityLabel={labels.previousMonth}
            disabled={!canGoBack}
            onPress={() => shiftMonth(-1)}
          />
          <Text allowFontScaling={allowFontScaling} style={styles.monthLabel} accessibilityRole="header">
            {monthLabel}
          </Text>
          <IconButton
            iconName="chevron-right"
            accessibilityLabel={labels.nextMonth}
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
                  // A day outside the limits isn't painted as part of the
                  // range: it looks disabled, and that is what it is.
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
