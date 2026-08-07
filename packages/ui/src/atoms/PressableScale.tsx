import React, { memo, useRef } from 'react';
import { Animated, Pressable, type PressableProps, type GestureResponderEvent } from 'react-native';

export interface PressableScaleProps extends PressableProps {
  /** Escala objetivo al presionar. @default 0.96 */
  scaleTo?: number;
  children: React.ReactNode;
}

/**
 * PressableScale
 * Feedback táctil de "achicarse" al presionar, con Animated.spring de RN
 * (useNativeDriver: true — corre en el hilo nativo, sin coste de JS por frame).
 * No depende de reanimated: la librería entera es cero-dependencias.
 */
export const PressableScale = memo(
  ({ scaleTo = 0.96, style, children, onPressIn, onPressOut, disabled, ...props }: PressableScaleProps) => {
    const scale = useRef(new Animated.Value(1)).current;

    const animateTo = (value: number) => {
      Animated.spring(scale, {
        toValue: value,
        useNativeDriver: true,
        speed: 50,
        bounciness: 6,
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
      <Pressable
        {...props}
        disabled={disabled}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={style}
      >
        <Animated.View style={{ transform: [{ scale }] }}>{children}</Animated.View>
      </Pressable>
    );
  }
);
PressableScale.displayName = 'PressableScale';
