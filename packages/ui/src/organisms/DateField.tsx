import React, { memo, useCallback, useState } from 'react';
import { Text, TouchableOpacity, View, type StyleProp, type ViewStyle } from 'react-native';
import { createStyles } from '../theme/createStyles';
import { useAllowFontScaling, useColors, useLabels } from '../theme/UIProvider';
import { Modal } from './Modal';
import { DatePicker, type DatePickerProps, type DateRange } from './DatePicker';
import { Button } from '../atoms/Button';

export interface DateFieldProps
  extends Pick<DatePickerProps, 'minDate' | 'maxDate' | 'monthNames' | 'weekdayNames' | 'firstDayOfWeek'> {
  label?: string;
  required?: boolean;
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
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  /** Formatea la fecha en el campo. @default "Month D, YYYY" */
  format?: (date: Date) => string;
  /** Título del modal del calendario. @default el `selectDate` de `useLabels()` */
  modalTitle?: string;
  /**
   * Si se pasa, el modal muestra un botón que borra la selección y cierra.
   * Sin esto no hay botón: el "Clear" anterior sólo cerraba, sin limpiar nada.
   */
  onClear?: () => void;
  /** Texto de ese botón. @default el `clear` de `useLabels()` */
  clearLabel?: string;
  containerStyle?: StyleProp<ViewStyle>;
  testID?: string;
}

function defaultFormat(date: Date, monthNames: string[]): string {
  return `${monthNames[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

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
    borderWidth: 2,
    borderColor: theme.colors.border,
    minHeight: 50,
    paddingHorizontal: theme.tokens.spacing.lg,
  },
  fieldError: { borderColor: theme.colors.error },
  fieldText: { fontSize: theme.tokens.fontSize.lg, color: theme.colors.text },
  placeholder: { color: theme.colors.textLight },
  errorText: { fontSize: theme.tokens.fontSize.sm, color: theme.colors.errorText },
}));

/**
 * DateField
 * Campo de fecha: se ve como un Input, abre un `DatePicker` en un Modal al
 * tocarlo. Sin picker nativo del sistema, así que se ve y se comporta igual
 * en iOS y Android.
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
    placeholder = 'Select a date',
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
    const isRange = mode === 'range';

    const formatDate = (date: Date) => (format ? format(date) : defaultFormat(date, months));

    // El calendario se cierra solo cuando ya no falta nada por elegir: en
    // rango, recién cuando el segundo toque cierra el intervalo.
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
    let display = placeholder;
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
          style={[styles.field, !!error && styles.fieldError, disabled && { opacity: 0.5 }]}
          onPress={() => setOpen(true)}
          disabled={disabled}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={hasValue ? `${label ?? placeholder}, ${display}` : (label ?? placeholder)}
          accessibilityState={{ disabled, expanded: open }}
        >
          <Text allowFontScaling={allowFontScaling} style={[styles.fieldText, !hasValue && styles.placeholder]}>
            {display}
          </Text>
          <Text allowFontScaling={allowFontScaling} style={{ color: colors.textLight }}>
            {'▾'}
          </Text>
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
