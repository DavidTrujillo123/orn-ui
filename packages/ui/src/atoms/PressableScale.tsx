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
  /** Pressable content. */
  children: React.ReactNode;
}

/** Short spring with almost no bounce: feedback arrives in ~100 ms (Doherty). */
const PRESS_SPRING = { speed: 50, bounciness: 6 } as const;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * PressableScale
 * Tactile "shrink" feedback on press, with RN's Animated.spring
 * (useNativeDriver: true — runs on the native thread, no JS cost per frame).
 * Doesn't depend on reanimated: the whole library is zero-dependency.
 *
 * Gestalt, figure/ground: as it sinks, the pressed element separates for an
 * instant from the rest and confirms what was touched (Doherty: immediate
 * response). Announces itself as a button by default (`accessibilityRole` can
 * be changed) and, when disabled, exposes `disabled` to the screen reader.
 * With Reduce Motion it doesn't scale.
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
