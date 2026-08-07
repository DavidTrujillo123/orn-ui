import React, { memo, useEffect, useRef } from 'react';
import { Animated, Text, TouchableOpacity } from 'react-native';
import { createStyles } from '../theme/createStyles';
import { useAllowFontScaling, useColors } from '../theme/UIProvider';
import { Icon } from '../icons/Icon';

export interface CheckboxProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  label?: string;
  color?: string;
  disabled?: boolean;
  testID?: string;
}

const useStyles = createStyles((theme) => ({
  container: { flexDirection: 'row', alignItems: 'center', marginBottom: theme.tokens.spacing.sm },
  box: {
    width: 24,
    height: 24,
    borderRadius: theme.tokens.radius.sm,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.tokens.spacing.sm + 2,
  },
  label: { fontSize: theme.tokens.fontSize.md, color: theme.colors.text },
}));

export const Checkbox = memo(({ value, onValueChange, label, color, disabled, testID }: CheckboxProps) => {
  const colors = useColors();
  const styles = useStyles();
  const allowFontScaling = useAllowFontScaling();
  const activeColor = color || colors.primary;
  const progress = useRef(new Animated.Value(value ? 1 : 0)).current;
  const checkScale = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(progress, { toValue: value ? 1 : 0, duration: 150, useNativeDriver: false }).start();
    Animated.spring(checkScale, {
      toValue: value ? 1 : 0,
      useNativeDriver: true,
      speed: 40,
      bounciness: 10,
    }).start();
  }, [value]);

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
      accessibilityLabel={label}
      testID={testID}
    >
      <Animated.View style={[styles.box, { backgroundColor, borderColor, opacity: disabled ? 0.5 : 1 }]}>
        <Animated.View style={{ transform: [{ scale: checkScale }] }}>
          <Icon name="check" size={16} color={colors.white} />
        </Animated.View>
      </Animated.View>
      {label && (
        <Text allowFontScaling={allowFontScaling} style={styles.label}>
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
});
Checkbox.displayName = 'Checkbox';
