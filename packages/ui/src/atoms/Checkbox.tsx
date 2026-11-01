import React, { memo, useEffect, useRef } from 'react';
import { Animated, Text, TouchableOpacity } from 'react-native';
import { createStyles } from '../theme/createStyles';
import { useAllowFontScaling, useColors, useTheme } from '../theme/UIProvider';
import { Icon } from '../icons/Icon';
import { onColor } from '../icons/defaultIcons';
import { useReduceMotion } from './Transition';

export interface CheckboxProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  label?: string;
  color?: string;
  disabled?: boolean;
  /** Effectively required without `label`: it is all a screen reader announces. */
  accessibilityLabel?: string;
  testID?: string;
}

const useStyles = createStyles((theme) => ({
  // 44pt de alto: la fila entera es el área táctil (Fitts). Reemplaza al
  // marginBottom que separaba checkboxes apilados; ahora el aire lo da la fila.
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
 * Casilla + label opcional; toda la fila es tocable.
 *
 * Gestalt:
 * - Proximidad: la casilla y su label van a `spacing.md`, menos que la
 *   separación entre filas, así cada label se lee con su casilla.
 * - Región común: la fila entera es el área táctil, no solo la casilla, y
 *   mide al menos 44pt de alto (Fitts).
 * - Figura y fondo: marcada, la casilla se rellena con el acento y el check
 *   toma negro o blanco según ese relleno (también con `color` propio).
 *
 * `disabled` atenúa la casilla y el label (no solo la casilla). La animación
 * del check se omite con Reduce Motion.
 */
export const Checkbox = memo(({ value, onValueChange, label, color, disabled, accessibilityLabel, testID }: CheckboxProps) => {
  const colors = useColors();
  const styles = useStyles();
  const allowFontScaling = useAllowFontScaling();
  const activeColor = color || colors.primary;
  // El check va encima del relleno: con `color` propio se elige negro o blanco
  // por luminancia (un blanco fijo desaparecía sobre colores claros).
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
