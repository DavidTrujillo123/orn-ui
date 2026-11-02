import React, { memo, useRef } from 'react';
import {
  Animated,
  Pressable,
  type GestureResponderEvent,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useReduceMotion } from './Transition';

export interface PressableScaleProps extends Omit<PressableProps, 'style' | 'children'> {
  /** Target scale when pressed. @default 0.96 */
  scaleTo?: number;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}

/** Resorte corto y casi sin rebote: el feedback llega en ~100 ms (Doherty). */
const PRESS_SPRING = { speed: 50, bounciness: 6 } as const;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * PressableScale
 * Feedback táctil de "achicarse" al presionar, con Animated.spring de RN
 * (useNativeDriver: true — corre en el hilo nativo, sin coste de JS por frame).
 * No depende de reanimated: la librería entera es cero-dependencias.
 *
 * Gestalt, figura/fondo: al hundirse, lo presionado se separa un instante del
 * resto y confirma qué se tocó (Doherty: respuesta inmediata). Se anuncia como
 * botón por defecto (`accessibilityRole` se puede cambiar) y deshabilitado
 * expone `disabled` al lector. Con Reduce Motion no escala.
 */
export const PressableScale = memo(
  ({
    scaleTo = 0.96,
    style,
    children,
    onPressIn,
    onPressOut,
    disabled,
    accessibilityRole = 'button',
    accessibilityState,
    ...props
  }: PressableScaleProps) => {
    const scale = useRef(new Animated.Value(1)).current;
    const reduceMotion = useReduceMotion();

    const animateTo = (value: number) => {
      if (reduceMotion) return;
      Animated.spring(scale, {
        toValue: value,
        useNativeDriver: true,
        ...PRESS_SPRING,
      }).start();
    };

    const handlePressIn = (e: GestureResponderEvent) => {
      if (!disabled) animateTo(scaleTo);
      onPressIn?.(e);
    };

    const handlePressOut = (e: GestureResponderEvent) => {
      if (!disabled) animateTo(1);
      onPressOut?.(e);
    };

    return (
      <AnimatedPressable
        {...props}
        accessibilityRole={accessibilityRole}
        accessibilityState={{ ...accessibilityState, disabled: !!disabled }}
        disabled={disabled}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[style, { transform: [{ scale }] }]}
      >
        {children}
      </AnimatedPressable>
    );
  }
);
PressableScale.displayName = 'PressableScale';
