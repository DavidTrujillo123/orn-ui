import React, { memo, useEffect, useRef } from 'react';
import { Animated, Text, TouchableOpacity } from 'react-native';
import { createStyles } from '../theme/createStyles';
import { useAllowFontScaling, useColors, useTheme } from '../theme/UIProvider';
import { Icon } from '../icons/Icon';
import { onColor } from '../icons/defaultIcons';
import { useReduceMotion } from './Transition';

export interface CheckboxProps {
  /** Whether the box is checked (controlled). */
  value: boolean;
  /** Called with the new value when the row is pressed. */
  onValueChange: (value: boolean) => void;
  /** Text next to the box; the whole row is touchable. Also the accessible name. */
  label?: string;
  /**
   * Fill and border color when checked. The check turns black or white for contrast. @default
   * colors.primary
   */
  color?: string;
  /** Dims the box and the label and ignores presses. */
  disabled?: boolean;
  /** Effectively required without `label`: it is all a screen reader announces. */
  accessibilityLabel?: string;
  testID?: string;
}

const useStyles = createStyles((theme) => ({
  // 44pt tall: the whole row is the touch area (Fitts). Replaces the
  // marginBottom that separated stacked checkboxes; now the row provides the room.
  container: { flexDirection: 'row', alignItems: 'center', minHeight: 44 },
  box: {
    width: 24,
    height: 24,
    borderRadius: theme.tokens.radius.sm,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.tokens.spacing.md,
  },
  label: { fontSize: theme.tokens.fontSize.md, color: theme.colors.text },
  labelDisabled: { color: theme.colors.textLight },
}));

/**
 * Checkbox
 * Box + optional label; the whole row is touchable.
 *
 * Gestalt:
 * - Proximity: the box and its label sit `spacing.md` apart, less than the
 *   spacing between rows, so each label reads with its box.
 * - Common region: the whole row is the touch area, not just the box, and it
 *   is at least 44pt tall (Fitts).
 * - Figure and ground: when checked, the box fills with the accent and the
 *   check turns black or white depending on that fill (also with a custom `color`).
 *
 * `disabled` dims the box and the label (not just the box). The check
 * animation is skipped with Reduce Motion.
 */
export const Checkbox = memo(({ value, onValueChange, label, color, disabled, accessibilityLabel, testID }: CheckboxProps) => {
  const colors = useColors();
  const styles = useStyles();
  const allowFontScaling = useAllowFontScaling();
  const activeColor = color || colors.primary;
  // The check sits on top of the fill: with a custom `color`, black or white is
  // picked by luminance (a fixed white disappeared over light colors).
  const checkColor = color ? onColor(color) : colors.onPrimary;
  const theme = useTheme();
  const reduceMotion = useReduceMotion();
  const progress = useRef(new Animated.Value(value ? 1 : 0)).current;
  const checkScale = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    if (reduceMotion) {
      progress.setValue(value ? 1 : 0);
      checkScale.setValue(value ? 1 : 0);
      return;
    }
    Animated.timing(progress, { toValue: value ? 1 : 0, duration: theme.tokens.duration.fast, useNativeDriver: false }).start();
    Animated.spring(checkScale, {
      toValue: value ? 1 : 0,
      useNativeDriver: true,
      speed: 40,
      bounciness: 10,
    }).start();
  }, [value, reduceMotion]);

  const backgroundColor = progress.interpolate({ inputRange: [0, 1], outputRange: [colors.surface, activeColor] });
  const borderColor = progress.interpolate({ inputRange: [0, 1], outputRange: [colors.border, activeColor] });

  return (
    <TouchableOpacity
      style={styles.container}
      activeOpacity={0.7}
      disabled={disabled}
      onPress={() => onValueChange(!value)}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: value, disabled: !!disabled }}
      accessibilityLabel={accessibilityLabel ?? label}
      testID={testID}
    >
      <Animated.View style={[styles.box, { backgroundColor, borderColor, opacity: disabled ? 0.5 : 1 }]}>
        <Animated.View style={{ transform: [{ scale: checkScale }] }}>
          <Icon name="check" size={16} color={checkColor} />
        </Animated.View>
      </Animated.View>
      {!!label && (
        <Text allowFontScaling={allowFontScaling} style={[styles.label, disabled && styles.labelDisabled]}>
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
});
Checkbox.displayName = 'Checkbox';
