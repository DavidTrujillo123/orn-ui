import React, { memo } from 'react';
import { TextInput, TouchableOpacity, View, type StyleProp, type ViewStyle } from 'react-native';
import { createStyles } from '../theme/createStyles';
import { useAllowFontScaling, useColors } from '../theme/UIProvider';
import { Icon } from '../icons/Icon';

export interface StepperProps {
  value: string;
  onChangeText: (text: string) => void;
  onIncrement: () => void;
  onDecrement: () => void;
  size?: 'sm' | 'md';
  style?: StyleProp<ViewStyle>;
  incrementAccessibilityLabel?: string;
  decrementAccessibilityLabel?: string;
}

const useStyles = createStyles((theme) => ({
  control: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.tokens.radius.md },
  btn: { height: '100%', justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.inputBackground },
  btnSm: { backgroundColor: 'transparent' },
  input: { flex: 1, textAlign: 'center', fontSize: theme.tokens.fontSize.lg, color: theme.colors.text, height: '100%' },
  inputSm: { flex: 0, width: 50, borderLeftWidth: 1, borderRightWidth: 1, borderColor: theme.colors.border },
}));

/** Stepper: botón "-" + input numérico editable + botón "+". */
export const Stepper = memo(
  ({
    value,
    onChangeText,
    onIncrement,
    onDecrement,
    size = 'md',
    style,
    incrementAccessibilityLabel = 'Increment',
    decrementAccessibilityLabel = 'Decrement',
  }: StepperProps) => {
    const colors = useColors();
    const styles = useStyles();
    const allowFontScaling = useAllowFontScaling();
    const isSmall = size === 'sm';
    const btnSize = isSmall ? 36 : 48;
    const iconSize = isSmall ? 18 : 20;

    return (
      <View style={[styles.control, { height: isSmall ? 36 : 48 }, style]}>
        <TouchableOpacity
          onPress={onDecrement}
          style={[styles.btn, { width: btnSize }, isSmall && styles.btnSm]}
          accessibilityRole="button"
          accessibilityLabel={decrementAccessibilityLabel}
        >
          <Icon name="minus" size={iconSize} color={colors.primary} />
        </TouchableOpacity>
        <TextInput
          allowFontScaling={allowFontScaling}
          style={[styles.input, isSmall && styles.inputSm]}
          value={value}
          onChangeText={onChangeText}
          keyboardType="numeric"
          selectTextOnFocus
          accessibilityLabel="Quantity"
        />
        <TouchableOpacity
          onPress={onIncrement}
          style={[styles.btn, { width: btnSize }, isSmall && styles.btnSm]}
          accessibilityRole="button"
          accessibilityLabel={incrementAccessibilityLabel}
        >
          <Icon name="plus" size={iconSize} color={colors.primary} />
        </TouchableOpacity>
      </View>
    );
  }
);
Stepper.displayName = 'Stepper';
