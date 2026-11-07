import React, { memo, useCallback, useState } from 'react';
import { Text, TouchableOpacity, View, type StyleProp, type ViewStyle } from 'react-native';
import { createStyles } from '../theme/createStyles';
import { useAllowFontScaling, useColors, useLabels } from '../theme/UIProvider';
import { Modal } from './Modal';
import { DatePicker, type DatePickerProps, type DateRange } from './DatePicker';
import { Button } from '../atoms/Button';
import { Icon } from '../icons/Icon';

export interface DateFieldProps
  extends Pick<DatePickerProps, 'minDate' | 'maxDate' | 'monthNames' | 'weekdayNames' | 'firstDayOfWeek'> {
  /** Text above the field; also its accessible name. */
  label?: string;
  /** Shows an asterisk and says "required" to screen readers. @default false */
  required?: boolean;
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
  /** Text while empty. @default labels.selectDate */
  placeholder?: string;
  /** Error under the field (red border); announced to screen readers. */
  error?: string;
  /** Dims the field and ignores taps. @default false */
  disabled?: boolean;
  /** Formats the date in the field. @default "Month D, YYYY" */
  format?: (date: Date) => string;
  /** Title of the calendar modal. @default the `selectDate` from `useLabels()` */
  modalTitle?: string;
  /**
   * If provided, the modal shows a button that clears the selection and closes.
   * Without this there's no button: the previous "Clear" only closed, without clearing anything.
   */
  onClear?: () => void;
  /** Text for that button. @default the `clear` from `useLabels()` */
  clearLabel?: string;
  /** Style of the outer wrapper (label, field and error). */
  containerStyle?: StyleProp<ViewStyle>;
  testID?: string;
}

function defaultFormat(date: Date, monthNames: string[]): string {
  return `${monthNames[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

const DISABLED_OPACITY = 0.5;
const PRESSED_OPACITY = 0.7;
/** Same box as Input, so a form reads as one column of identical fields. */
const FIELD_MIN_HEIGHT = 50;
const FIELD_BORDER = 2;
const CHEVRON_SIZE = 20;

const useStyles = createStyles((theme) => ({
  container: { marginBottom: theme.tokens.spacing.lg, width: '100%', gap: theme.tokens.spacing.sm },
  label: { fontSize: theme.tokens.fontSize.md, fontWeight: theme.tokens.fontWeight.medium, color: theme.colors.text },
  required: { color: theme.colors.errorText },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.inputBackground,
    borderRadius: theme.tokens.radius.lg,
    borderWidth: FIELD_BORDER,
    borderColor: theme.colors.border,
    minHeight: FIELD_MIN_HEIGHT,
    paddingHorizontal: theme.tokens.spacing.lg,
  },
  fieldError: { borderColor: theme.colors.error },
  fieldDisabled: { opacity: DISABLED_OPACITY },
  fieldText: { fontSize: theme.tokens.fontSize.lg, color: theme.colors.text },
  placeholder: { color: theme.colors.textLight },
  errorText: { fontSize: theme.tokens.fontSize.sm, color: theme.colors.errorText },
}));

/**
 * DateField
 * Date field: looks like an Input, opens a `DatePicker` in a Modal when
 * tapped. No native system picker, so it looks and behaves the same on iOS
 * and Android.
 *
 * Gestalt, similarity (and Jakob's law): same box, border, height and label
 * as Input, and the same chevron as Select, so in a form it reads as one more
 * field; only the chevron says it opens something. Proximity: label, field
 * and error stack tight, as one unit.
 *
 * Accessibility: the name includes the label, "required" and the chosen date;
 * the error is a hint; `expanded` tells whether the calendar is open.
 */
export const DateField = memo(
  ({
    label,
    required = false,
    mode = 'single',
    value,
    onChange,
    range,
    onRangeChange,
    placeholder,
    error,
    disabled = false,
    format,
    modalTitle,
    onClear,
    clearLabel,
    containerStyle,
    monthNames,
    testID,
    ...pickerProps
  }: DateFieldProps) => {
    const colors = useColors();
    const styles = useStyles();
    const labels = useLabels();
    const allowFontScaling = useAllowFontScaling();
    const [open, setOpen] = useState(false);

    const months = monthNames ?? labels.months;
    const emptyText = placeholder ?? labels.selectDate;
    const isRange = mode === 'range';

    const formatDate = (date: Date) => (format ? format(date) : defaultFormat(date, months));

    // The calendar closes on its own only once there is nothing left to pick:
    // in range mode, only when the second tap closes the interval.
    const handleChange = useCallback(
      (date: Date) => {
        onChange?.(date);
        setOpen(false);
      },
      [onChange]
    );

    const handleRangeChange = useCallback(
      (next: DateRange) => {
        onRangeChange?.(next);
        if (next.end) setOpen(false);
      },
      [onRangeChange]
    );

    const handleClear = useCallback(() => {
      onClear?.();
      setOpen(false);
    }, [onClear]);

    const hasValue = isRange ? !!range?.start : !!value;
    let display = emptyText;
    if (isRange && range?.start) {
      display = range.end ? `${formatDate(range.start)} — ${formatDate(range.end)}` : formatDate(range.start);
    } else if (!isRange && value) {
      display = formatDate(value);
    }

    return (
      <View style={[styles.container, containerStyle]} testID={testID}>
        {!!label && (
          <Text allowFontScaling={allowFontScaling} style={styles.label}>
            {label}
            {required && <Text style={styles.required}> *</Text>}
          </Text>
        )}

        <TouchableOpacity
          style={[styles.field, !!error && styles.fieldError, disabled && styles.fieldDisabled]}
          onPress={() => setOpen(true)}
          disabled={disabled}
          activeOpacity={PRESSED_OPACITY}
          accessibilityRole="button"
          accessibilityLabel={[label ?? emptyText, required ? labels.required : null, hasValue ? display : null]
            .filter(Boolean)
            .join(', ')}
          accessibilityHint={error || undefined}
          accessibilityState={{ disabled, expanded: open }}
        >
          <Text allowFontScaling={allowFontScaling} style={[styles.fieldText, !hasValue && styles.placeholder]}>
            {display}
          </Text>
          <Icon name="chevron-down" size={CHEVRON_SIZE} color={colors.textLight} />
        </TouchableOpacity>

        {!!error && (
          <Text allowFontScaling={allowFontScaling} style={styles.errorText}>
            {error}
          </Text>
        )}

        <Modal
          visible={open}
          onClose={() => setOpen(false)}
          title={modalTitle ?? labels.selectDate}
          variant="overlay"
          scrollable={false}
          footer={
            onClear ? <Button title={clearLabel ?? labels.clear} variant="ghost" onPress={handleClear} /> : undefined
          }
        >
          <DatePicker
            mode={mode}
            value={value}
            range={range}
            monthNames={months}
            {...pickerProps}
            onChange={handleChange}
            onRangeChange={handleRangeChange}
          />
        </Modal>
      </View>
    );
  }
);
DateField.displayName = 'DateField';
