import React, { memo, useState } from 'react';
import { Text, TouchableOpacity, View, type StyleProp, type ViewStyle } from 'react-native';
import { createStyles } from '../theme/createStyles';
import { useAllowFontScaling, useColors } from '../theme/UIProvider';
import { Modal } from './Modal';
import { DatePicker, DEFAULT_MONTH_NAMES, type DatePickerProps } from './DatePicker';
import { Button } from '../atoms/Button';

export interface DateFieldProps
  extends Pick<DatePickerProps, 'minDate' | 'maxDate' | 'monthNames' | 'weekdayNames' | 'firstDayOfWeek'> {
  label?: string;
  required?: boolean;
  value?: Date;
  onChange: (date: Date) => void;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  /** Formatea la fecha en el campo. @default "D de Month de YYYY" en inglés */
  format?: (date: Date) => string;
  /** Título del modal del calendario. @default 'Select date' */
  modalTitle?: string;
  clearLabel?: string;
  containerStyle?: StyleProp<ViewStyle>;
}

function defaultFormat(date: Date, monthNames: string[]): string {
  return `${monthNames[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

const useStyles = createStyles((theme) => ({
  container: { marginBottom: theme.tokens.spacing.lg, width: '100%', gap: theme.tokens.spacing.sm },
  label: { fontSize: theme.tokens.fontSize.md, fontWeight: theme.tokens.fontWeight.medium, color: theme.colors.text },
  required: { color: theme.colors.error },
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
  errorText: { fontSize: theme.tokens.fontSize.sm, color: theme.colors.error },
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
    value,
    onChange,
    placeholder = 'Select a date',
    error,
    disabled = false,
    format,
    modalTitle = 'Select date',
    clearLabel = 'Clear',
    containerStyle,
    monthNames = DEFAULT_MONTH_NAMES,
    ...pickerProps
  }: DateFieldProps) => {
    const colors = useColors();
    const styles = useStyles();
    const allowFontScaling = useAllowFontScaling();
    const [open, setOpen] = useState(false);

    const display = value ? (format ? format(value) : defaultFormat(value, monthNames)) : placeholder;

    return (
      <View style={[styles.container, containerStyle]}>
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
          accessibilityLabel={label ?? placeholder}
          accessibilityState={{ disabled, expanded: open }}
        >
          <Text allowFontScaling={allowFontScaling} style={[styles.fieldText, !value && styles.placeholder]}>
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
          title={modalTitle}
          variant="overlay"
          scrollable={false}
          footer={<Button title={clearLabel} variant="ghost" onPress={() => setOpen(false)} />}
        >
          <DatePicker
            value={value}
            monthNames={monthNames}
            {...pickerProps}
            onChange={(date) => {
              onChange(date);
              setOpen(false);
            }}
          />
        </Modal>
      </View>
    );
  }
);
DateField.displayName = 'DateField';
