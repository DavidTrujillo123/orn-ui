import React, { memo, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '../theme/UIProvider';
import { useReduceMotion } from '../theme/useReduceMotion';

export type TransitionPreset =
  | 'fade'
  | 'scale'
  | 'pop'
  | 'slide-up'
  | 'slide-down'
  | 'slide-left'
  | 'slide-right';

export interface TransitionProps {
  /** Content that enters and exits. */
  children: React.ReactNode;
  /** Enters when true, exits (and unmounts) when false. @default true */
  visible?: boolean;
  /** One or more: 'fade scale' combines opacity and scale. @default 'fade' */
  preset?: TransitionPreset | TransitionPreset[];
  /** Timing duration in ms. @default tokens.duration.base */
  duration?: number;
  /** ms before starting. A per-index delay staggers a list. @default 0 */
  delay?: number;
  /** Pixels traveled by the slide presets. @default tokens.spacing.xxl (24) */
  distance?: number;
  /** Spring instead of timing (implicit in 'pop'). */
  spring?: boolean;
  /** Also animates the first render. When false it starts already present. @default true */
  appear?: boolean;
  /** Keeps the node mounted on exit, only hides it. @default false */
  keepMounted?: boolean;
  /**
   * 0→1 progress driven from outside. With this, Transition only interpolates:
   * whoever passes it decides when and how it advances (a PanResponder, for example).
   */
  value?: Animated.Value;
  /** Called when the enter animation finishes. Not called when driven by `value`. */
  onEntered?: () => void;
  /** Called when the exit animation finishes, before unmounting. Not called when driven by `value`. */
  onExited?: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const SCALE_FROM: Record<'scale' | 'pop', number> = { scale: 0.92, pop: 0.8 };
const hiddenStyle: ViewStyle = { pointerEvents: 'none' };
/** 'pop' spring: bounces once and settles (~350 ms), without oscillating. */
const POP_SPRING = { friction: 9, tension: 90 } as const;

// Lives in theme/ (UIProvider uses it too); re-exported here so existing
// imports don't break.
export { useReduceMotion };

/**
 * Transition
 * Wraps any tree and animates it on enter and exit. Every preset boils down
 * to `opacity` and `transform` over a single Animated.Value, which is what
 * `useNativeDriver` knows how to send to the native thread: the animation runs
 * there and the JS thread takes part in no frame — that is why there are no
 * height, width or color presets, which would force a return to JS every frame.
 *
 * The node stays mounted until the exit animation finishes, and the behavior
 * is identical on iOS and Android: there is no per-platform branch. While
 * exiting (or hidden with `keepMounted`) it stops receiving touches and leaves
 * the accessibility tree: what is invisible isn't read.
 *
 * Gestalt, common fate: what enters or exits together is perceived as a group;
 * with a per-index `delay` the list enters in reading order (continuity).
 * Respects Reduce Motion: jumps to the final state, callbacks still fire.
 */
export const Transition = memo(
  ({
    children,
    visible = true,
    preset = 'fade',
    duration,
    delay = 0,
    distance,
    spring,
    appear = true,
    keepMounted = false,
    value,
    onEntered,
    onExited,
    style,
    testID,
  }: TransitionProps) => {
    const theme = useTheme();
    const travel = distance ?? theme.tokens.spacing.xxl;
    // Resolved here, not inside the effect: depending on `theme` restarted the
    // animation (and fired onEntered again) every time the theme changed.
    const resolvedDuration = duration ?? theme.tokens.duration.base;
    const reduceMotion = useReduceMotion();
    const internal = useRef(new Animated.Value(visible && !appear ? 1 : 0)).current;
    const progress = value ?? internal;
    const driven = value === undefined;

    const [mounted, setMounted] = useState(visible || keepMounted);

    // The callbacks live in a ref: passed inline they change identity on
    // every render and, as effect dependencies, would restart the animation.
    const callbacks = useRef({ onEntered, onExited });
    useEffect(() => {
      callbacks.current = { onEntered, onExited };
    });

    const presetKey = Array.isArray(preset) ? preset.join(' ') : preset;
    const presets = useMemo(() => presetKey.split(' ') as TransitionPreset[], [presetKey]);

    useEffect(() => {
      if (visible) setMounted(true);
    }, [visible]);

    useEffect(() => {
      if (!driven) return;
      const toValue = visible ? 1 : 0;
      const useSpring = spring ?? presets.includes('pop');

      const animation = reduceMotion
        ? Animated.timing(progress, { toValue, duration: 0, delay, useNativeDriver: true })
        : useSpring
          ? Animated.spring(progress, { toValue, delay, ...POP_SPRING, useNativeDriver: true })
          : Animated.timing(progress, {
              toValue,
              delay,
              duration: resolvedDuration,
              easing: visible ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic),
              useNativeDriver: true,
            });

      animation.start(({ finished }) => {
        if (!finished) return;
        if (visible) {
          callbacks.current.onEntered?.();
          return;
        }
        callbacks.current.onExited?.();
        if (!keepMounted) setMounted(false);
      });

      return () => animation.stop();
    }, [visible, driven, reduceMotion, spring, delay, resolvedDuration, keepMounted, presets, progress]);

    const animatedStyle = useMemo(() => {
      type Interpolated = Animated.AnimatedInterpolation<number>;
      const transform: Array<{ scale: Interpolated } | { translateX: Interpolated } | { translateY: Interpolated }> = [];
      let opacity: Animated.Value | undefined;

      for (const item of presets) {
        if (item === 'fade') {
          opacity = progress;
          continue;
        }
        if (item === 'scale' || item === 'pop') {
          transform.push({
            scale: progress.interpolate({ inputRange: [0, 1], outputRange: [SCALE_FROM[item], 1] }),
          });
          continue;
        }
        const vertical = item === 'slide-up' || item === 'slide-down';
        const from = item === 'slide-up' || item === 'slide-left' ? travel : -travel;
        const offset = progress.interpolate({ inputRange: [0, 1], outputRange: [from, 0] });
        transform.push(vertical ? { translateY: offset } : { translateX: offset });
      }

      return { opacity, transform };
    }, [presets, progress, travel]);

    if (!mounted) return null;

    return (
      <Animated.View
        testID={testID}
        accessibilityElementsHidden={!visible}
        importantForAccessibility={visible ? 'auto' : 'no-hide-descendants'}
        style={[style, animatedStyle, !visible && hiddenStyle]}
      >
        {children}
      </Animated.View>
    );
  }
);
Transition.displayName = 'Transition';
