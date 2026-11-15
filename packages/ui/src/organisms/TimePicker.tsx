import React, { memo, useCallback, useMemo } from 'react';
import { Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { createStyles } from '../theme/createStyles';
import { useAllowFontScaling, useLabels } from '../theme/UIProvider';
import { SegmentedControl } from '../molecules/SegmentedControl';
import { OptionWheel, type OptionWheelOption } from './OptionWheel';

export interface TimeValue {
  /** 0–23. Siempre 24 h, aunque la UI sea de 12 h. */
  hour: number;
  /** 0–59. Se espera que caiga en la grilla de `minuteStep`. */
  minute: number;
}

export type TimeFormat = '12h' | '24h';

export interface TimePickerProps {
  /** Valor controlado. `undefined` deja las ruedas sin selección. */
  value?: TimeValue;
  onChange?: (value: TimeValue) => void;
  /**
   * Solo cambia la presentación; `onChange` siempre devuelve una hora 24 h.
   * @default '24h'
   */
  hourFormat?: TimeFormat;
  /**
   * Entero 1–60. Las opciones de minutos son 0, step, 2*step... menores que 60.
   * @default 1
   */
  minuteStep?: number;
  /** Límite inferior inclusivo. */
  minTime?: TimeValue;
  /** Límite superior inclusivo. */
  maxTime?: TimeValue;
  /** Título visible sobre el picker. */
  label?: string;
  /**
   * Filas visibles por rueda. `OptionWheel` fuerza un número impar.
   * @default 3
   */
  visibleCount?: number;
  /** Alto de cada fila. @default 44 */
  itemHeight?: number;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

type Period = 'am' | 'pm';

const HOURS_24 = Array.from({ length: 24 }, (_, hour) => hour);
/** Orden de un reloj de 12 h: 12, 1, 2... 11. */
const HOURS_12 = Array.from({ length: 12 }, (_, index) => (index === 0 ? 12 : index));
const MINUTES_IN_HOUR = 60;
const DEFAULT_VISIBLE_COUNT = 3;
const DEFAULT_ITEM_HEIGHT = 44;
const DEFAULT_MINUTE_STEP = 1;

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

const useStyles = createStyles((theme) => ({
  root: { gap: theme.tokens.spacing.sm },
  label: {
    fontSize: theme.tokens.fontSize.lg,
    fontWeight: theme.tokens.fontWeight.semibold,
    color: theme.colors.text,
  },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: theme.tokens.spacing.md },
  wheel: { flex: 1 },
  empty: { opacity: 0.55 },
  unselected: {
    fontSize: theme.tokens.fontSize.sm,
    color: theme.colors.textLight,
    textAlign: 'center',
  },
}));

/**
 * TimePicker
 * Dos ruedas —horas y minutos— compuestas con `OptionWheel`, sin picker
 * nativo. La rueda de horas en 12 h va de 12 a 11 y el periodo AM/PM es un
 * `SegmentedControl` aparte: una rueda de dos filas no tiene centro y
 * `OptionWheel` fuerza un número impar.
 *
 * Gestalt, proximidad y destino común: las dos columnas comparten el mismo
 * alto de fila y la misma ventana central, así que se leen como un solo
 * control de tiempo y no como dos listas independientes. El AM/PM queda
 * debajo porque pertenece a la hora, no a los minutos.
 *
 * El valor canónico siempre es 24 h. En 12 h, `0` se muestra como `12 AM`,
 * `12` como `12 PM` y `13` como `1 PM`. `OptionWheel` sólo corrige a la
 * opción habilitada más cercana en `commitAt()`/`step()` —interacción del
 * usuario—, nunca al montar ni al recibir un valor de afuera: por eso un
 * valor fuera de rango no dispara `onChange` hasta que se toca una rueda.
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
    const hasSelection = hasValue && hasValidHour && anchor !== undefined;

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
          <Text allowFontScaling={allowFontScaling} style={styles.label}>
            {label}
          </Text>
        )}

        <View style={[styles.row, !hasSelection && styles.empty]}>
          <OptionWheel
            label={labels.hour}
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
            label={labels.minute}
            options={minuteOptions}
            selectedValue={hasValue && hasValidHour ? value!.minute : undefined}
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
            value={period}
            onChange={handlePeriodSelect}
            disabled={disabled || !hasSelection || !hasValidHour}
            testID={testID ? `${testID}-period` : undefined}
          />
        )}

        {!hasValue && (
          <Text allowFontScaling={allowFontScaling} style={styles.unselected}>
            {labels.unselected}
          </Text>
        )}
      </View>
    );
  }
);
TimePicker.displayName = 'TimePicker';
