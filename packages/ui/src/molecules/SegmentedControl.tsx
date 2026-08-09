import React, { memo } from 'react';
import { Text, TouchableOpacity, View, type StyleProp, type ViewStyle } from 'react-native';
import { createStyles } from '../theme/createStyles';
import { useAllowFontScaling } from '../theme/UIProvider';

export interface SegmentedControlOption<T extends string = string> {
  value: T;
  label: string;
  disabled?: boolean;
}

export interface SegmentedControlProps<T extends string = string> {
  options: SegmentedControlOption<T>[];
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const useStyles = createStyles((theme) => ({
  track: {
    flexDirection: 'row',
    backgroundColor: theme.colors.inputBackground,
    borderRadius: theme.tokens.radius.md,
    padding: 3,
  },
  segment: {
    flex: 1,
    paddingVertical: theme.tokens.spacing.sm,
    borderRadius: theme.tokens.radius.sm,
    alignItems: 'center',
  },
  segmentActive: { backgroundColor: theme.colors.surface, ...theme.tokens.shadow.sm },
  segmentDisabled: { opacity: 0.5 },
  label: { fontSize: theme.tokens.fontSize.sm, fontWeight: theme.tokens.fontWeight.medium, color: theme.colors.textLight },
  labelActive: { color: theme.colors.primaryText, fontWeight: theme.tokens.fontWeight.semibold },
}));

/**
 * SegmentedControl
 * Elige una opción entre pocas, todas visibles. No conoce ningún estado
 * global: recibe `value` y avisa por `onChange`.
 */
function SegmentedControlInner<T extends string>({
  options,
  value,
  onChange,
  disabled = false,
  style,
  testID,
}: SegmentedControlProps<T>) {
  const styles = useStyles();
  const allowFontScaling = useAllowFontScaling();

  return (
    <View style={[styles.track, style]} accessibilityRole="radiogroup" testID={testID}>
      {options.map((option) => {
        const active = option.value === value;
        const isDisabled = disabled || !!option.disabled;
        return (
          <TouchableOpacity
            key={option.value}
            style={[styles.segment, active && styles.segmentActive, isDisabled && styles.segmentDisabled]}
            onPress={() => onChange(option.value)}
            disabled={isDisabled}
            accessibilityRole="radio"
            accessibilityState={{ selected: active, checked: active, disabled: isDisabled }}
            accessibilityLabel={option.label}
            testID={testID && `${testID}-${option.value}`}
          >
            <Text allowFontScaling={allowFontScaling} style={[styles.label, active && styles.labelActive]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// memo() pierde los genéricos al envolver: el cast los devuelve para que
// `value` y `onChange` sigan atados al union de `options`.
export const SegmentedControl = memo(SegmentedControlInner) as typeof SegmentedControlInner;
