import React, { memo, useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  View,
  type DimensionValue,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { createStyles } from '../theme/createStyles';
import { useTheme } from '../theme/UIProvider';
import { useReduceMotion } from './Transition';

/** Half a pulse cycle (opaque → faint). A loading loop, not a transition: it doesn't come from `duration`. */
const PULSE_HALF_MS = 700;

export type SkeletonVariant = 'rect' | 'text' | 'circle';

export interface SkeletonProps {
  /** Width of the placeholder. @default '100%' ('circle' also uses this as the diameter) */
  width?: DimensionValue;
  /** Height of the placeholder. @default 16 ('text' uses Body's line height; 'circle', the width) */
  height?: DimensionValue;
  /** Shape: a block, a line of text or a circle. @default 'rect' */
  variant?: SkeletonVariant;
  /** Override of the theme's radius. */
  radius?: number;
  /** Stacked lines, only for variant="text". @default 1 */
  lines?: number;
  /** Width of the last line, so the paragraph doesn't end as a solid block. @default '60%' */
  lastLineWidth?: DimensionValue;
  /** Pulses while waiting. Off when the system's Reduce Motion is on. @default true */
  animated?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const useStyles = createStyles((theme) => ({
  block: { backgroundColor: theme.colors.skeleton },
  // Each line takes exactly `lineHeight.md` (Body's): a `fontSize.md` bar
  // plus half the leading above and below. That way the fake paragraph
  // measures the same as the real one and nothing jumps when the content arrives.
  textLine: {
    marginVertical: (theme.tokens.lineHeight.md - theme.tokens.fontSize.md) / 2,
  },
}));

/**
 * Skeleton
 * Placeholder that pulses while the real content arrives. It reserves the
 * exact space of what it replaces, so the screen doesn't jump when the data
 * shows up — which is precisely what a centered Spinner can't do.
 *
 * Gestalt, similarity: the silhouette repeats the shape and size of the
 * content (a circle for avatars, Body-height lines for text), so the eye
 * already groups the screen before the data arrives. Respects Reduce Motion:
 * no pulse, a static block.
 */
export const Skeleton = memo(
  ({
    width = '100%',
    height = 16,
    variant = 'rect',
    radius,
    lines = 1,
    lastLineWidth = '60%',
    animated = true,
    style,
    testID,
  }: SkeletonProps) => {
    const theme = useTheme();
    const styles = useStyles();
    const reduceMotion = useReduceMotion();
    const pulsing = animated && !reduceMotion;
    const pulse = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      if (!pulsing) return;
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, {
            toValue: 1,
            duration: PULSE_HALF_MS,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.quad),
          }),
          Animated.timing(pulse, {
            toValue: 0,
            duration: PULSE_HALF_MS,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.quad),
          }),
        ])
      );
      loop.start();
      return () => {
        loop.stop();
        pulse.setValue(0);
      };
    }, [pulsing, pulse]);

    const isCircle = variant === 'circle';
    const isText = variant === 'text';
    const opacity = pulsing ? pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 0.4] }) : 1;
    const resolvedHeight = isCircle ? width : isText ? theme.tokens.fontSize.md : height;
    const resolvedRadius =
      radius ?? (isCircle ? theme.tokens.radius.full : isText ? theme.tokens.radius.xs : theme.tokens.radius.sm);

    const barStyle = (barWidth: DimensionValue): StyleProp<ViewStyle> => [
      styles.block,
      isText && styles.textLine,
      { width: barWidth, height: resolvedHeight, borderRadius: resolvedRadius, opacity },
    ];

    const a11y = { accessibilityElementsHidden: true, importantForAccessibility: 'no-hide-descendants' as const };

    if (isText && lines > 1) {
      return (
        <View style={style} testID={testID} {...a11y}>
          {Array.from({ length: lines }, (_, i) => (
            <Animated.View
              key={i}
              testID={testID && `${testID}-${i}`}
              style={barStyle(i === lines - 1 ? lastLineWidth : width)}
            />
          ))}
        </View>
      );
    }

    return <Animated.View style={[barStyle(width), style]} testID={testID} {...a11y} />;
  }
);
Skeleton.displayName = 'Skeleton';
