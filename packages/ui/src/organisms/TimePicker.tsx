import React, { memo, useCallback, useMemo } from 'react';
import { Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { createStyles } from '../theme/createStyles';
import { useAllowFontScaling, useLabels } from '../theme/UIProvider';
import { SegmentedControl } from '../molecules/SegmentedControl';
import { OptionWheel, type OptionWheelOption } from './OptionWheel';

export interface TimeValue {
  /** 0–23. Always 24-hour, even when the UI shows 12-hour time. */
  hour: number;
  /** 0–59. Expected to fall on the `minuteStep` grid. */
  minute: number;
}

export type TimeFormat = '12h' | '24h';

export interface TimePickerProps {
  /** Controlled value. `undefined` leaves both wheels unselected. */
  value?: TimeValue;
  onChange?: (value: TimeValue) => void;
  /**
   * Changes the presentation only; `onChange` always returns a 24-hour time.
   * @default '24h'
   */
  hourFormat?: TimeFormat;
  /**
   * Integer 1–60. Minute options are 0, step, 2*step... below 60.
   * @default 1
   */
  minuteStep?: number;
  /** Inclusive lower bound. */
  minTime?: TimeValue;
  /** Inclusive upper bound. */
  maxTime?: TimeValue;
  /** Visible title above the picker. */
  label?: string;
  /**
   * Visible rows per wheel. `OptionWheel` forces an odd number.
   * @default 3
   */
  visibleCount?: number;
  /** Height of each row. @default 44 */
  itemHeight?: number;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

type Period = 'am' | 'pm';

const HOURS_24 = Array.from({ length: 24 }, (_, hour) => hour);
/** 12-hour clock order: 12, 1, 2... 11. */
const HOURS_12 = Array.from({ length: 12 }, (_, index) => (index === 0 ? 12 : index));
const MINUTES_IN_HOUR = 60;
const DEFAULT_VISIBLE_COUNT = 3;
const DEFAULT_ITEM_HEIGHT = 44;
const DEFAULT_MINUTE_STEP = 1;
/** Half ink: the wheels are present but nothing is selected yet. */
const EMPTY_OPACITY = 0.5;

function normalizeStep(step: number | undefined): number {
  if (step === undefined || !Number.isFinite(step)) return DEFAULT_MINUTE_STEP;
  return Math.min(MINUTES_IN_HOUR, Math.max(1, Math.round(step)));
}

function toMinutes(time: TimeValue): number {
  return time.hour * 60 + time.minute;
}

function buildMinuteValues(step: number): number[] {
  const values: number[] = [];
  for (let minute = 0; minute < MINUTES_IN_HOUR; minute += step) values.push(minute);
  return values;
}

function allowedMinutesForHour(
  hour: number,
  step: number,
  min: number | undefined,
  max: number | undefined
): number[] {
  return buildMinuteValues(step).filter((minute) => {
    const total = hour * 60 + minute;
    return (min === undefined || total >= min) && (max === undefined || total <= max);
  });
}

function nearestMinute(allowed: number[], target: number): number | undefined {
  let best: number | undefined;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const minute of allowed) {
    const distance = Math.abs(minute - target);
    if (distance < bestDistance) {
      best = minute;
      bestDistance = distance;
    }
  }
  return best;
}

function firstAllowedTime(
  step: number,
  min: number | undefined,
  max: number | undefined
): TimeValue | undefined {
  for (const hour of HOURS_24) {
    const allowed = allowedMinutesForHour(hour, step, min, max);
    if (allowed.length > 0) return { hour, minute: allowed[0]! };
  }
  return undefined;
}

function toDisplayedHour(hour: number): number {
  return hour % 12 === 0 ? 12 : hour % 12;
}

function periodOf(hour: number): Period {
  return hour < 12 ? 'am' : 'pm';
}

function toCanonicalHour(displayedHour: number, period: Period): number {
  return (displayedHour % 12) + (period === 'pm' ? 12 : 0);
}

function formatHour24(hour: number): string {
  return String(hour).padStart(2, '0');
}

function formatMinute(minute: number): string {
  return String(minute).padStart(2, '0');
}

function isValidHour(hour: number): boolean {
  return Number.isInteger(hour) && hour >= 0 && hour < 24;
}

function isValidMinute(minute: number): boolean {
  return Number.isInteger(minute) && minute >= 0 && minute < MINUTES_IN_HOUR;
}

const useStyles = createStyles((theme) => ({
  root: { gap: theme.tokens.spacing.sm },
  label: {
    fontSize: theme.tokens.fontSize.lg,
    fontWeight: theme.tokens.fontWeight.semibold,
    color: theme.colors.text,
  },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: theme.tokens.spacing.md },
  wheel: { flex: 1 },
  empty: { opacity: EMPTY_OPACITY },
  unselected: {
    fontSize: theme.tokens.fontSize.sm,
    color: theme.colors.textLight,
    textAlign: 'center',
  },
}));

/**
 * TimePicker
 * Two wheels —hours and minutes— composed with `OptionWheel`, with no native
 * picker. The 12-hour wheel runs from 12 to 11 and the AM/PM period is a
 * separate `SegmentedControl`: a two-row wheel has no centre and `OptionWheel`
 * forces an odd number of rows.
 *
 * Gestalt, proximity and common fate: both columns share the same row height
 * and the same centre window, so they read as one time control and not as two
 * independent lists. AM/PM sits below because it belongs to the hour, not to
 * the minutes.
 *
 * The canonical value is always 24-hour. In 12-hour mode, `0` shows as
 * `12 AM`, `12` as `12 PM` and `13` as `1 PM`. `OptionWheel` only corrects to
 * the nearest enabled option in `commitAt()`/`step()` —user interaction—,
 * never on mount or when receiving an external value: that is why an
 * out-of-range value does not fire `onChange` until a wheel is touched.
 */
export const TimePicker = memo(
  ({
    value,
    onChange,
    hourFormat = '24h',
    minuteStep,
    minTime,
    maxTime,
    label,
    visibleCount = DEFAULT_VISIBLE_COUNT,
    itemHeight = DEFAULT_ITEM_HEIGHT,
    disabled = false,
    style,
    testID,
  }: TimePickerProps) => {
    const styles = useStyles();
    const labels = useLabels();
    const allowFontScaling = useAllowFontScaling();
    const is12h = hourFormat === '12h';
    const step = normalizeStep(minuteStep);

    const min = minTime ? toMinutes(minTime) : undefined;
    const max = maxTime ? toMinutes(maxTime) : undefined;

    const bounds = useMemo(() => {
      if (min !== undefined && max !== undefined && min > max) {
        if (__DEV__) {
          console.warn('orn-ui: <TimePicker> received minTime after maxTime; the bounds are ignored.');
        }
        return { min: undefined, max: undefined };
      }
      return { min, max };
    }, [min, max]);

    const anchor = useMemo(() => {
      const first = firstAllowedTime(step, bounds.min, bounds.max);
      if (!first && __DEV__) {
        console.warn(
          'orn-ui: <TimePicker> has no representable time for these bounds and minuteStep; the wheels are disabled.'
        );
      }
      return first;
    }, [step, bounds.min, bounds.max]);

    const hasValue = value !== undefined;
    const hasValidHour = value === undefined || isValidHour(value.hour);
    const hasValidMinute = value === undefined || isValidMinute(value.minute);
    const hasSelection = hasValue && hasValidHour && hasValidMinute && anchor !== undefined;

    const hourOptions = useMemo<OptionWheelOption<number>[]>(
      () =>
        (is12h ? HOURS_12 : HOURS_24).map((hour) => {
          const allowed = is12h
            ? allowedMinutesForHour(toCanonicalHour(hour, 'am'), step, bounds.min, bounds.max).length > 0 ||
              allowedMinutesForHour(toCanonicalHour(hour, 'pm'), step, bounds.min, bounds.max).length > 0
            : allowedMinutesForHour(hour, step, bounds.min, bounds.max).length > 0;
          return {
            label: is12h ? String(hour) : formatHour24(hour),
            value: hour,
            disabled: !allowed,
          };
        }),
      [is12h, step, bounds.min, bounds.max]
    );

    const minuteWheelHour = hasValidHour ? value?.hour ?? anchor?.hour ?? 0 : anchor?.hour ?? 0;
    const allowedForMinuteWheel = useMemo(
      () => allowedMinutesForHour(minuteWheelHour, step, bounds.min, bounds.max),
      [minuteWheelHour, step, bounds.min, bounds.max]
    );
    const allowedMinuteSet = useMemo(() => new Set(allowedForMinuteWheel), [allowedForMinuteWheel]);
    const minuteWheelDisabled =
      disabled || anchor === undefined || !hasValidHour || allowedForMinuteWheel.length === 0;
    const minuteOptions = useMemo<OptionWheelOption<number>[]>(
      () =>
        buildMinuteValues(step).map((minute) => ({
          label: formatMinute(minute),
          value: minute,
          disabled: !allowedMinuteSet.has(minute),
        })),
      [step, allowedMinuteSet]
    );

    const displayedHour =
      hasValidHour && value ? toDisplayedHour(value.hour) : anchor ? toDisplayedHour(anchor.hour) : 12;
    const period = hasValidHour && value ? periodOf(value.hour) : anchor ? periodOf(anchor.hour) : 'am';
    const selectedPeriod = hasSelection ? period : ('' as Period);
    const periodOptions = useMemo(() => {
      if (!is12h) return [];
      return (['am', 'pm'] as const).map((option) => ({
        value: option,
        label: option === 'am' ? labels.am : labels.pm,
        disabled: allowedMinutesForHour(toCanonicalHour(displayedHour, option), step, bounds.min, bounds.max).length === 0,
      }));
    }, [is12h, labels.am, labels.pm, displayedHour, step, bounds.min, bounds.max]);

    const handleHourSelect = useCallback(
      (hour: number) => {
        const currentPeriod =
          hasValidHour && value ? periodOf(value.hour) : anchor ? periodOf(anchor.hour) : 'am';
        let canonical = is12h ? toCanonicalHour(hour, currentPeriod) : hour;
        let allowed = allowedMinutesForHour(canonical, step, bounds.min, bounds.max);

        if (is12h && allowed.length === 0) {
          const otherPeriod: Period = currentPeriod === 'am' ? 'pm' : 'am';
          const otherCanonical = toCanonicalHour(hour, otherPeriod);
          const otherAllowed = allowedMinutesForHour(otherCanonical, step, bounds.min, bounds.max);
          if (otherAllowed.length > 0) {
            canonical = otherCanonical;
            allowed = otherAllowed;
          }
        }

        const target =
          value && allowed.includes(value.minute)
            ? value.minute
            : nearestMinute(allowed, value?.minute ?? allowed[0] ?? 0);
        if (target === undefined) return;
        onChange?.({ hour: canonical, minute: target });
      },
      [value, hasValidHour, anchor, is12h, step, bounds.min, bounds.max, onChange]
    );

    const handleMinuteSelect = useCallback(
      (minute: number) => {
        if (value && !hasValidHour) return;
        const hour = value?.hour ?? anchor?.hour;
        if (hour === undefined) return;
        onChange?.({ hour, minute });
      },
      [value, hasValidHour, anchor, onChange]
    );

    const handlePeriodSelect = useCallback(
      (next: Period) => {
        if (!value || !hasValidHour) return;
        const canonical = toCanonicalHour(toDisplayedHour(value.hour), next);
        const allowed = allowedMinutesForHour(canonical, step, bounds.min, bounds.max);
        const minute = allowed.includes(value.minute) ? value.minute : nearestMinute(allowed, value.minute);
        if (minute === undefined) return;
        onChange?.({ hour: canonical, minute });
      },
      [value, hasValidHour, step, bounds.min, bounds.max, onChange]
    );

    return (
      <View style={[styles.root, style]} testID={testID}>
        {!!label && (
          <Text accessibilityRole="header" allowFontScaling={allowFontScaling} style={styles.label}>
            {label}
          </Text>
        )}

        <View style={[styles.row, !hasSelection && styles.empty]}>
          <OptionWheel
            label={labels.timeHour}
            options={hourOptions}
            selectedValue={
              hasValue && hasValidHour ? (is12h ? toDisplayedHour(value!.hour) : value!.hour) : undefined
            }
            onSelect={handleHourSelect}
            visibleCount={visibleCount}
            itemHeight={itemHeight}
            disabled={disabled || anchor === undefined}
            style={styles.wheel}
            testID={testID ? `${testID}-hour` : undefined}
          />
          <OptionWheel
            label={labels.timeMinute}
            options={minuteOptions}
            selectedValue={hasValue && hasValidHour && hasValidMinute ? value!.minute : undefined}
            onSelect={handleMinuteSelect}
            visibleCount={visibleCount}
            itemHeight={itemHeight}
            disabled={minuteWheelDisabled}
            style={styles.wheel}
            testID={testID ? `${testID}-minute` : undefined}
          />
        </View>

        {is12h && (
          <SegmentedControl
            options={periodOptions}
            value={selectedPeriod}
            onChange={handlePeriodSelect}
            disabled={disabled || !hasSelection || !hasValidHour}
            testID={testID ? `${testID}-period` : undefined}
          />
        )}

        {!hasValue && (
          <Text allowFontScaling={allowFontScaling} style={styles.unselected}>
            {labels.timeUnselected}
          </Text>
        )}
      </View>
    );
  }
);
TimePicker.displayName = 'TimePicker';
