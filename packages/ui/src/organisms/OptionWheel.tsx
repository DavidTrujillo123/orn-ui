import React, { useCallback, useEffect, useMemo, useRef, type ComponentRef } from 'react';
import {
  Animated,
  Platform,
  ScrollView,
  Text,
  View,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { createStyles } from '../theme/createStyles';
import { useAllowFontScaling, useTheme } from '../theme/UIProvider';
import { useReduceMotion } from '../atoms/Transition';

export interface OptionWheelOption<T> {
  label: string;
  value: T;
  /** The wheel refuses to settle here and slides to the nearest enabled row. */
  disabled?: boolean;
}

export type OptionWheelVariant = 'window' | 'spotlight';

export interface OptionWheelProps<T> {
  /** The range, in order. Each option has a label, its value, and may be disabled. */
  options: OptionWheelOption<T>[];
  /** Value of the option in the centre row (controlled). */
  selectedValue: T | undefined;
  /** Called with the value of the option the wheel settles on. */
  onSelect: (value: T) => void;
  /** Title above the wheel. */
  label?: string;
  /** Required when there's no `label`: the wheel as a whole needs a name. */
  accessibilityLabel?: string;
  /**
   * Rows on screen. Forced to the next odd number so one of them is the
   * centre. @default 5
   */
  visibleCount?: number;
  /** Height of each row. @default 44 */
  itemHeight?: number;
  /** Fixed text to the right of the centre row ('kg', 'min'). */
  unit?: string;
  /** Tilts the far rows to suggest a cylinder. @default true */
  perspective?: boolean;
  /**
   * 'window' marks the pick with a band behind the centre row. 'spotlight'
   * drops the band and lets the far rows fall away and blur instead, which
   * needs a quiet surface under it to read.
   * @default 'window'
   */
  variant?: OptionWheelVariant;
  /**
   * Colour of the option labels. The surface the wheel sits on is whoever
   * composes it to paint — this is how the text keeps contrast against it.
   * @default theme.colors.text
   */
  textColor?: string;
  /**
   * Radius, in pixels, of the wheel the rows sit on. Its centre is off to the
   * side, so the rows bow inwards as they get further from the middle and tilt
   * with the tangent — the wheel reads as a rim seen edge-on instead of a flat
   * list. Smaller radius, rounder arc. Undefined leaves the rows flat.
   */
  curveRadius?: number;
  /** Which side the wheel's centre is on. @default 'left' */
  curveFrom?: 'left' | 'right';
  /** Dims the wheel and stops it from turning. @default false */
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const DEFAULT_VISIBLE_COUNT = 5;
/** 44pt: iOS's touch minimum, and enough for an `lg` line with room to spare. */
const DEFAULT_ITEM_HEIGHT = 44;
/**
 * Quiet time after the wheel stops before the selection is reported. A drag
 * can end with momentum still running: committing on `onScrollEndDrag` would
 * cancel the fling and pull the wheel back to the row under the finger.
 */
const SETTLE_DELAY = 100;
/**
 * Lift speed, in px/ms, above which the wheel is flinging and must be left
 * alone until `onMomentumScrollEnd`. Arming the fallback here is what used to
 * report the row under the finger and pull a strong fling back to it.
 */
const FLING_VELOCITY = 0.15;
/**
 * Rows toward each side that the interpolation distinguishes; further out,
 * all the same (`extrapolate: 'clamp'`). The three ranges are symmetric
 * around the center: the row above and the row below look the same, except
 * the one above tilts backward and the one below forward.
 */
const FALLOFF = 2;

/**
 * Each variant is a set of ranges. 'spotlight' falls off much faster and
 * tilts more because it has no band marking the center: all the work of
 * saying which one is selected is done by contrast and sharpness.
 */
const RANGES: Record<OptionWheelVariant, { opacity: number[]; scale: number[]; rotation: string[] }> = {
  window: {
    opacity: [0.22, 0.55, 1, 0.55, 0.22],
    scale: [0.8, 0.9, 1, 0.9, 0.8],
    rotation: ['60deg', '32deg', '0deg', '-32deg', '-60deg'],
  },
  spotlight: {
    opacity: [0.16, 0.42, 1, 0.42, 0.16],
    scale: [0.72, 0.87, 1, 0.87, 0.72],
    rotation: ['72deg', '40deg', '0deg', '-40deg', '-72deg'],
  },
};

/**
 * React Native has no blur without a native dependency, so in 'spotlight'
 * each row that isn't in the center is also drawn twice, offset and at half
 * ink. The overlap smears the stroke: it isn't a gaussian blur, but at that
 * size and opacity it reads the same, and it is still `opacity` and
 * `transform` over the same scroll, i.e. the native thread.
 */
/**
 * Where each point of the `inputRange` falls on the arc. `Animated` can't
 * compute roots or arcsines, but it doesn't need to: the five distances to
 * the center are fixed per row, so the arc's sagitta and the tangent's angle
 * are resolved once here and go in as `outputRange`.
 */
function arcOffsets(radius: number, itemHeight: number, sign: number) {
  const shift: number[] = [];
  const angle: string[] = [];
  for (let step = -FALLOFF; step <= FALLOFF; step += 1) {
    // Beyond the radius the row has already turned over: cut it off there
    // instead of taking the root of a negative.
    const dy = Math.min(Math.abs(step * itemHeight), radius);
    // Arc sagitta: how far the row moves in toward the center of the wheel.
    shift.push(sign * (radius - Math.sqrt(radius * radius - dy * dy)));
    // The arc's tangent, so the row follows the curve instead of crossing it.
    const degrees = Math.asin(dy / radius) * (180 / Math.PI);
    angle.push(`${-sign * Math.sign(step) * degrees}deg`);
  }
  return { shift, angle };
}

const GHOST_SHIFTS = [-1, 1];
const GHOST_SPREAD = 3;
const GHOST_OPACITY_RANGE = [0.55, 0.3, 0, 0.3, 0.55];

const useStyles = createStyles((theme) => ({
  root: { gap: theme.tokens.spacing.sm },
  label: {
    fontWeight: theme.tokens.fontWeight.bold,
    fontSize: theme.tokens.fontSize.md,
    color: theme.colors.text,
  },
  viewport: { overflow: 'hidden' },
  disabled: { opacity: 0.5 },
  // The center window: figure against the ground of options passing by.
  window: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.primarySoft,
  },
  row: { justifyContent: 'center', alignItems: 'center' },
  ghost: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowContent: { flexDirection: 'row', alignItems: 'center', gap: theme.tokens.spacing.xs },
  text: { fontSize: theme.tokens.fontSize.lg, color: theme.colors.text },
  textDisabled: { color: theme.colors.textLight },
  unit: { fontSize: theme.tokens.fontSize.sm, color: theme.colors.textLight },
}));

/** The enabled index closest to `index`, or -1 if there is none. */
function nearestEnabled<T>(options: OptionWheelOption<T>[], index: number): number {
  if (options.length === 0) return -1;
  for (let step = 0; step < options.length; step += 1) {
    const before = index - step;
    const after = index + step;
    if (after < options.length && !options[after]?.disabled) return after;
    if (before >= 0 && !options[before]?.disabled) return before;
  }
  return -1;
}

/**
 * OptionWheel
 * Wheel picker: the options pass through a fixed window and the one left in
 * the center is the selected one. The scroll snaps to the row height, so
 * lifting the finger anywhere always leaves one option centered, never half.
 *
 * Gestalt, figure and ground: what marks the selection isn't a style on the
 * row —which would travel with it— but a still window on top of the list. The
 * figure stays, the ground moves, and that is why the wheel reads without
 * reading: the place signals, not the color. And common fate: all rows shrink
 * and tilt by the same law relative to the center, so they are perceived as a
 * rigid surface that turns and not as N rows animating on their own.
 *
 * Scale, opacity and tilt come from interpolating the scroll's
 * `contentOffset`, not from React state: they are computed on the native
 * thread (`useNativeDriver`) and the JS thread only takes part once the wheel
 * has stopped, to report what was selected. With "reduce motion" on, the tilt
 * is turned off and the size stays, since it is information, not decoration.
 *
 * `disabled` on an option can't keep the snap from centering it, so the
 * wheel centers it and moves on its own to the nearest enabled one. With no
 * selected value there is no window either: an empty wheel must not look
 * chosen.
 */
export function OptionWheel<T extends string | number>({
  options,
  selectedValue,
  onSelect,
  label,
  accessibilityLabel,
  visibleCount = DEFAULT_VISIBLE_COUNT,
  itemHeight = DEFAULT_ITEM_HEIGHT,
  unit,
  perspective = true,
  variant = 'window',
  textColor,
  curveRadius,
  curveFrom = 'left',
  disabled = false,
  style,
  testID,
}: OptionWheelProps<T>) {
  const theme = useTheme();
  const styles = useStyles();
  const allowFontScaling = useAllowFontScaling();
  const reduceMotion = useReduceMotion();

  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const scrollY = useRef(new Animated.Value(0)).current;
  // The first positioning isn't animated: the wheel has to appear already
  // set at its value, not traveling to it.
  const settled = useRef(false);
  const lastOffset = useRef(0);
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didLayout = useRef(false);

  // Always odd: with an even number there is no center row to line up with
  // the window, and the snap would leave the selection between two rows.
  const rows = visibleCount % 2 === 0 ? visibleCount + 1 : visibleCount;
  const padding = ((rows - 1) / 2) * itemHeight;
  const height = rows * itemHeight;

  const selectedIndex = useMemo(
    () => options.findIndex((option) => option.value === selectedValue),
    [options, selectedValue]
  );

  const scrollToIndex = useCallback(
    (index: number, animated: boolean) => {
      const y = index * itemHeight;
      scrollRef.current?.scrollTo({ y, animated });
      // Where the wheel is, or is heading: the effect compares this to the
      // selected row so it doesn't animate back to it after a commit.
      lastOffset.current = y;
      // `scrollY` is only fed by `onScroll`, and an unanimated jump doesn't
      // always emit it: without this the value stays at 0, the interpolation
      // thinks the centered row is the first one and dims the one that is
      // really in the window. The animated scroll does emit along the whole
      // path, so forcing it there would fight the animation.
      if (!animated) scrollY.setValue(y);
    },
    [itemHeight, scrollY]
  );

  useEffect(() => {
    if (selectedIndex < 0) return;
    // If the wheel is already centred on the row, animating to it would cut a
    // fling that is still finishing. Otherwise (it stopped between two rows,
    // or the value changed from outside) centre it.
    const target = selectedIndex * itemHeight;
    if (settled.current && Math.abs(lastOffset.current - target) < 1) return;
    scrollToIndex(selectedIndex, settled.current && !reduceMotion);
    settled.current = true;
  }, [selectedIndex, scrollToIndex, reduceMotion, itemHeight]);

  /**
   * Runs once the wheel is quiet, not when the finger lifts: a fling still has
   * momentum then, and snapping at that moment cancels it and pulls the wheel
   * back. `onMomentumScrollEnd` is the real signal; the fallback timer in
   * `onScrollEndDrag` covers the drags that settle without momentum (and iOS
   * not firing it for a short drag). Re-entering with the same index is
   * harmless because it only reports when it changes.
   */
  const commitAt = useCallback(
    (offsetY: number) => {
      const raw = Math.round(offsetY / itemHeight);
      const clamped = Math.min(Math.max(raw, 0), options.length - 1);
      const landed = options[clamped];
      if (!landed) return;
      const target = landed.disabled ? nearestEnabled(options, clamped) : clamped;
      const option = options[target];
      // With no enabled options there is nowhere to stop: the wheel stays where
      // it was left and reports nothing.
      if (!option) return;
      // The native snap has already centred the row. Only a disabled row
      // needs a second, animated move to the nearest enabled one.
      if (target !== clamped) scrollToIndex(target, true);
      if (option.value !== selectedValue) onSelect(option.value);
    },
    [options, itemHeight, selectedValue, onSelect, scrollToIndex]
  );

  const clearSettleTimer = useCallback(() => {
    if (settleTimer.current !== null) {
      clearTimeout(settleTimer.current);
      settleTimer.current = null;
    }
  }, []);

  const scheduleCommit = useCallback(() => {
    clearSettleTimer();
    settleTimer.current = setTimeout(() => {
      settleTimer.current = null;
      commitAt(lastOffset.current);
    }, SETTLE_DELAY);
  }, [clearSettleTimer, commitAt]);

  useEffect(() => clearSettleTimer, [clearSettleTimer]);

  const onScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      lastOffset.current = event.nativeEvent.contentOffset.y;
      // The fallback only exists while the wheel settles without momentum (a
      // slow drag with no fling). A fling cancels it in
      // `onMomentumScrollBegin`, so this can never report a row mid-flight.
      if (settleTimer.current !== null) scheduleCommit();
    },
    [scheduleCommit]
  );

  const onScrollBeginDrag = useCallback(() => {
    clearSettleTimer();
  }, [clearSettleTimer]);

  const onScrollEndDrag = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      lastOffset.current = event.nativeEvent.contentOffset.y;
      // A fast lift becomes a fling. `onMomentumScrollBegin` cancels this
      // timer, but if the JS thread is busy it can fire first, report the row
      // the finger left, and the parent scrolls back to it. On Android the
      // native momentum events are reliable, so only slow lifts need the
      // fallback; iOS still arms it because it sometimes skips them.
      const velocity = Math.abs(event.nativeEvent.velocity?.y ?? 0);
      if (Platform.OS !== 'android' || velocity < FLING_VELOCITY) scheduleCommit();
    },
    [scheduleCommit]
  );

  const onMomentumScrollBegin = useCallback(() => {
    // From here on the wheel is gliding: reporting a row now would make the
    // parent scroll back to it and stop the fling in the middle.
    clearSettleTimer();
  }, [clearSettleTimer]);

  const onMomentumScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      clearSettleTimer();
      commitAt(event.nativeEvent.contentOffset.y);
    },
    [clearSettleTimer, commitAt]
  );

  /** VoiceOver/TalkBack go through the wheel with increment/decrement, not the finger. */
  const step = useCallback(
    (delta: number) => {
      if (disabled || selectedIndex < 0) return;
      const next = nearestEnabled(options, selectedIndex + delta);
      const option = options[next];
      // At the edge, `nearestEnabled` returns the row we are already on.
      if (!option || next === selectedIndex) return;
      onSelect(option.value);
    },
    [disabled, options, selectedIndex, onSelect]
  );

  const onLayout = useCallback(
    (_: LayoutChangeEvent) => {
      // Only the first layout positions the wheel. Later layout passes can
      // arrive with the `selectedIndex` of the previous render (the commit
      // that just ended a fling re-renders the parent) and would jump the
      // wheel back to the old row without animating.
      if (didLayout.current) return;
      didLayout.current = true;
      if (selectedIndex >= 0) scrollToIndex(selectedIndex, false);
    },
    [selectedIndex, scrollToIndex]
  );

  const selected = selectedIndex >= 0 ? options[selectedIndex] : undefined;
  const ranges = RANGES[variant];
  // The simulated blur triples the text nodes: it only goes where it helps,
  // and not with "reduce motion", because there sharpness is the only thing
  // left to tell the selected row apart.
  const smeared = variant === 'spotlight' && !reduceMotion;
  const arc = useMemo(
    () =>
      curveRadius && curveRadius > 0 && !reduceMotion
        ? arcOffsets(curveRadius, itemHeight, curveFrom === 'left' ? -1 : 1)
        : undefined,
    [curveRadius, itemHeight, curveFrom, reduceMotion]
  );

  return (
    <View style={[styles.root, disabled && styles.disabled, style]} testID={testID}>
      {!!label && (
        <Text allowFontScaling={allowFontScaling} style={styles.label}>
          {label}
        </Text>
      )}

      <View
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={label ?? accessibilityLabel}
        accessibilityValue={{ text: selected?.label }}
        accessibilityState={{ disabled }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={(event) => step(event.nativeEvent.actionName === 'increment' ? 1 : -1)}
        style={[styles.viewport, { height }]}
        testID={testID && `${testID}-viewport`}
      >
        {variant === 'window' && selectedIndex >= 0 && (
          <View
            pointerEvents="none"
            style={[styles.window, { top: padding, height: itemHeight, borderRadius: theme.tokens.radius.sm }]}
            testID={testID && `${testID}-window`}
          />
        )}

        <Animated.ScrollView
          ref={scrollRef as never}
          onLayout={onLayout}
          scrollEnabled={!disabled}
          nestedScrollEnabled
          showsVerticalScrollIndicator={false}
          snapToInterval={itemHeight}
          decelerationRate={Platform.OS === 'android' ? 0.995 : 'normal'}
          scrollEventThrottle={16}
          contentContainerStyle={{ paddingVertical: padding }}
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
            useNativeDriver: true,
            listener: onScroll,
          })}
          onScrollBeginDrag={onScrollBeginDrag}
          onScrollEndDrag={onScrollEndDrag}
          onMomentumScrollBegin={onMomentumScrollBegin}
          onMomentumScrollEnd={onMomentumScrollEnd}
          testID={testID && `${testID}-scroll`}
        >
          {options.map((option, index) => {
            const centre = index * itemHeight;
            const inputRange = [
              centre - FALLOFF * itemHeight,
              centre - itemHeight,
              centre,
              centre + itemHeight,
              centre + FALLOFF * itemHeight,
            ];
            type Interpolated = Animated.AnimatedInterpolation<string | number>;
            const transform: Array<
              | { perspective: number }
              | { scale: Interpolated }
              | { rotateX: Interpolated }
              | { rotateZ: Interpolated }
              | { translateX: Interpolated }
            > = [
              { scale: scrollY.interpolate({ inputRange, outputRange: ranges.scale, extrapolate: 'clamp' }) },
            ];
            if (perspective && !reduceMotion) {
              // perspective goes first: applied after the rotation it doesn't
              // distort anything and the row looks flat even though it's rotated.
              transform.unshift({ perspective: height * 2 });
              transform.push({
                rotateX: scrollY.interpolate({ inputRange, outputRange: ranges.rotation, extrapolate: 'clamp' }),
              });
            }

            if (arc) {
              transform.push(
                { translateX: scrollY.interpolate({ inputRange, outputRange: arc.shift, extrapolate: 'clamp' }) },
                { rotateZ: scrollY.interpolate({ inputRange, outputRange: arc.angle, extrapolate: 'clamp' }) }
              );
            }

            const label = (
              <Text
                allowFontScaling={allowFontScaling}
                style={[styles.text, option.disabled && styles.textDisabled, !!textColor && { color: textColor }]}
              >
                {option.label}
              </Text>
            );

            return (
              <Animated.View
                key={String(option.value)}
                testID={testID && `${testID}-item-${index}`}
                style={[
                  styles.row,
                  {
                    height: itemHeight,
                    opacity: scrollY.interpolate({
                      inputRange,
                      outputRange: ranges.opacity,
                      extrapolate: 'clamp',
                    }),
                    transform,
                  },
                ]}
              >
                {smeared &&
                  GHOST_SHIFTS.map((direction) => (
                    <Animated.View
                      key={direction}
                      pointerEvents="none"
                      // `accessibilityElementsHidden` isn't enough: the reader
                      // would read the row three times over, because the whole
                      // wheel is already a single element and this lives inside it.
                      style={[
                        styles.ghost,
                        {
                          opacity: scrollY.interpolate({
                            inputRange,
                            outputRange: GHOST_OPACITY_RANGE,
                            extrapolate: 'clamp',
                          }),
                          transform: [
                            {
                              translateX: scrollY.interpolate({
                                inputRange,
                                outputRange: [
                                  direction * GHOST_SPREAD,
                                  direction * (GHOST_SPREAD / 2),
                                  0,
                                  direction * (GHOST_SPREAD / 2),
                                  direction * GHOST_SPREAD,
                                ],
                                extrapolate: 'clamp',
                              }),
                            },
                          ],
                        },
                      ]}
                    >
                      {label}
                    </Animated.View>
                  ))}

                <View style={styles.rowContent}>
                  {label}
                  {!!unit && index === selectedIndex && (
                    <Text allowFontScaling={allowFontScaling} style={styles.unit}>
                      {unit}
                    </Text>
                  )}
                </View>
              </Animated.View>
            );
          })}
        </Animated.ScrollView>
      </View>
    </View>
  );
}
