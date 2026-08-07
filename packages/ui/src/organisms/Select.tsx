import React, { memo, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { createStyles } from '../theme/createStyles';
import { useAllowFontScaling, useColors, useLabels } from '../theme/UIProvider';
import { Icon } from '../icons/Icon';

export interface SelectOption<T> {
  label: string;
  value: T;
}

export interface SelectProps<T> {
  label?: string;
  required?: boolean;
  options: SelectOption<T>[];
  selectedValue: T | undefined;
  onSelect: (value: T) => void;
  placeholder?: string;
  error?: string;
  isLoading?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
}

const useStyles = createStyles((theme) => ({
  container: { gap: theme.tokens.spacing.sm },
  containerOpen: { zIndex: 20, elevation: 20 },
  label: { fontWeight: theme.tokens.fontWeight.bold, fontSize: theme.tokens.fontSize.md, color: theme.colors.text },
  required: { color: theme.colors.error },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderRadius: theme.tokens.radius.lg,
    backgroundColor: theme.colors.inputBackground,
    minHeight: 50,
    paddingHorizontal: theme.tokens.spacing.lg,
  },
  fieldText: { fontSize: theme.tokens.fontSize.lg, color: theme.colors.text },
  fieldPlaceholder: { color: theme.colors.textLight },
  optionsList: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: theme.tokens.spacing.sm,
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderRadius: theme.tokens.radius.lg,
    backgroundColor: theme.colors.surface,
    overflow: 'hidden',
    zIndex: 20,
    elevation: 20,
    ...theme.tokens.shadow.md,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.tokens.spacing.lg,
    paddingVertical: theme.tokens.spacing.md + 2,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  optionRowLast: { borderBottomWidth: 0 },
  optionRowSelected: { backgroundColor: theme.colors.primary + '15' },
  optionText: { fontSize: theme.tokens.fontSize.lg - 1, color: theme.colors.text },
  optionTextSelected: { fontWeight: theme.tokens.fontWeight.semibold, color: theme.colors.primary },
  errorText: { fontSize: theme.tokens.fontSize.sm, color: theme.colors.error },
}));

/**
 * Select
 * Dropdown que expande la lista de opciones flotando sobre el resto del
 * contenido (position: absolute), en vez de empujarlo hacia abajo o abrir
 * un picker nativo del sistema.
 */
export function Select<T extends string | number>({
  label,
  required = false,
  options,
  selectedValue,
  onSelect,
  placeholder,
  error,
  isLoading = false,
  containerStyle,
}: SelectProps<T>) {
  const colors = useColors();
  const styles = useStyles();
  const labels = useLabels();
  const allowFontScaling = useAllowFontScaling();
  const [open, setOpen] = useState(false);
  const selectedOption = options.find((o) => o.value === selectedValue);

  return (
    <View style={[styles.container, open && styles.containerOpen, containerStyle]}>
      {label && (
        <Text allowFontScaling={allowFontScaling} style={styles.label}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      )}

      <Pressable
        style={styles.field}
        onPress={() => !isLoading && setOpen((o) => !o)}
        disabled={isLoading}
        accessibilityRole="button"
        accessibilityLabel={label ?? placeholder ?? labels.selectPlaceholder}
        accessibilityState={{ expanded: open, disabled: isLoading }}
      >
        <Text allowFontScaling={allowFontScaling} style={[styles.fieldText, !selectedOption && styles.fieldPlaceholder]}>
          {selectedOption?.label || placeholder || labels.selectPlaceholder}
        </Text>
        {isLoading ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <Icon name={open ? 'chevron-up' : 'chevron-down'} size={20} color={colors.textLight} />
        )}
      </Pressable>

      {open && !isLoading && (
        <View style={styles.optionsList}>
          {options.map((option, index) => {
            const isSelected = option.value === selectedValue;
            return (
              <Pressable
                key={String(option.value)}
                style={[styles.optionRow, index === options.length - 1 && styles.optionRowLast, isSelected && styles.optionRowSelected]}
                onPress={() => {
                  onSelect(option.value);
                  setOpen(false);
                }}
                accessibilityRole="menuitem"
                accessibilityState={{ selected: isSelected }}
              >
                <Text allowFontScaling={allowFontScaling} style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                  {option.label}
                </Text>
                {isSelected && <Icon name="check" size={18} color={colors.primary} />}
              </Pressable>
            );
          })}
        </View>
      )}

      {!!error && (
        <Text allowFontScaling={allowFontScaling} style={styles.errorText}>
          {error}
        </Text>
      )}
    </View>
  );
}
