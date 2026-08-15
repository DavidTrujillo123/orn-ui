import React, { memo, useRef } from 'react';
import {
  Animated,
  Pressable,
  type GestureResponderEvent,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

export interface PressableScaleProps extends Omit<PressableProps, 'style'> {
  /** Target scale when pressed. @default 0.96 */
  scaleTo?: number;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

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
      <AnimatedPressable
        {...props}
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
