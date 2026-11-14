import React, { memo, useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { createStyles } from '../theme/createStyles';
import { useAllowFontScaling, useColors } from '../theme/UIProvider';
import { PressableScale } from '../atoms/PressableScale';
import { useReduceMotion } from '../atoms/Transition';
import { Icon } from '../icons/Icon';
import type { IconName } from '../icons/types';

export type TimelineStatus = 'done' | 'pending';

/**
 * What a tap can do.
 * - 'free': any milestone responds and the line follows `items` wherever it
 *   goes, forward or back. It is the one to use when the path isn't
 *   progress, or when something else drives it.
 * - 'sequential': only the one after the reached milestone responds, and the
 *   line never goes back. Strict progression.
 * - 'revisit': the next one and all those already reached respond, and the
 *   line doesn't go back either. It is the "I can look at what came before
 *   without losing my progress" case.
 */
export type TimelineAdvance = 'free' | 'sequential' | 'revisit';

export interface TimelineItem {
  label: string;
  /** Glyph from the library's set, to the left of the label. */
  iconName?: IconName;
  /** Emoji to the left of the label. Wins over `iconName`. */
  emoji?: string;
  /** @default 'done' */
  status?: TimelineStatus;
}

export interface TimelineProps {
  /** The milestones, in order. Each has a label, optionally an icon or emoji, and its status. */
  items: TimelineItem[];
  /** Pixels the line bows away from the straight path. 0 draws it straight. @default 28 */
  curve?: number;
  /** Vertical distance between one node and the next. @default 84 */
  spacing?: number;
  /** Side the first pill goes to; the rest alternate. @default 'right' */
  startSide?: 'left' | 'right';
  /** Halo behind each pill. @default true */
  glow?: boolean;
  /** Makes each pill tappable and reports its index. */
  onItemPress?: (index: number) => void;
  /**
   * Which taps are allowed, and whether the line may go back. @default 'free'
   *
   * In 'sequential' and 'revisit' the line keeps the furthest point it has
   * been asked to draw, so a parent that hands back a shorter `items` does not
   * undo the progress. Swapping in a different list keeps it too — reset it by
   * remounting (a `key`).
   */
  advance?: TimelineAdvance;
  /**
   * The milestone being looked at right now, highlighted. It is not the
   * progress: it can sit behind the line without pulling it back.
   */
  selectedIndex?: number;
  /**
   * Milliseconds the line takes to travel one gap when a milestone is
   * reached. @default 420
   */
  duration?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const DEFAULT_CURVE = 28;
const DEFAULT_SPACING = 84;
const NODE = 14;
const LINE = 2;
/** Straight segments per span: with fewer, the curve looks polygonal. */
const SEGMENTS = 14;
const DOT = 3;
/** One dot every how many segments: the whole path is dotted underneath. */
const DOT_EVERY = 2;
const DEFAULT_DURATION = 420;
/**
 * How long a segment takes to light up, measured in milestones. Small so the
 * front of the line reads as an edge and not as a long gradient.
 */
const FADE = 0.06;
/**
 * Halo layers, from the outside in. There are many and very faint on
 * purpose: with three layers you see the rings, which is exactly the opposite
 * of a blur. The more steps and the smaller the opacity jump, the closer it
 * gets to a gradient.
 */
/** How far the halo sticks out of the pill: that is the room it needs. */
const GLOW_BLEED = 20;
const GLOW_LAYERS = [
  { inset: -GLOW_BLEED, opacity: 0.03 },
  { inset: -16, opacity: 0.035 },
  { inset: -12, opacity: 0.04 },
  { inset: -8, opacity: 0.045 },
  { inset: -5, opacity: 0.05 },
  { inset: -2, opacity: 0.055 },
];

const useStyles = createStyles((theme) => ({
  root: { alignSelf: 'stretch' },
  row: { flexDirection: 'row', alignItems: 'center' },
  side: { flex: 1, justifyContent: 'center' },
  sideLeft: { alignItems: 'flex-end', paddingRight: theme.tokens.spacing.md },
  sideRight: { alignItems: 'flex-start', paddingLeft: theme.tokens.spacing.md },
  node: {
    position: 'absolute',
    width: NODE,
    height: NODE,
    borderRadius: NODE / 2,
    borderWidth: LINE,
  },
  nodePending: { backgroundColor: 'transparent', borderColor: theme.colors.border },
  // Takes the whole circle minus the border, so the fill doesn't cover it.
  nodeFill: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: NODE / 2 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.tokens.spacing.sm,
    paddingVertical: theme.tokens.spacing.sm,
    paddingHorizontal: theme.tokens.spacing.lg,
    borderRadius: theme.tokens.radius.full,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceRaised,
  },
  // Focus is marked with the border, not the fill: the fill is already
  // saying something else (whether the milestone has been reached or not).
  pillSelected: { borderColor: theme.colors.primary, borderWidth: 2 },
  label: { fontSize: theme.tokens.fontSize.md, color: theme.colors.text },
  labelPending: { color: theme.colors.textLight },
  emoji: { fontSize: theme.tokens.fontSize.md },
  glow: {
    position: 'absolute',
    borderRadius: theme.tokens.radius.full,
    backgroundColor: theme.colors.text,
  },
  // The line and the nodes live in the same layer and are positioned with the
  // same coordinates. It is the only thing that guarantees the circle lands on
  // the curve: in the row's flow the node gets shifted by flex —and by the
  // paddings each side needs so its pill isn't clipped—, so it ended up to one
  // side of the line instead of on top of it.
  lineLayer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center' },
  // Gap the width of the node in the row: the pill is set apart from the
  // center the same as before, but the circle is no longer drawn here.
  nodeSlot: { width: NODE },
  segment: { position: 'absolute', width: LINE },
  dot: { position: 'absolute', width: DOT, height: DOT, borderRadius: DOT / 2 },
}));

/**
 * Horizontal offset of node `index` from the axis. One full wave along the
 * list: the first and the last fall on the axis, and the ones in the middle
 * swing to one side and the other. It is what turns a column into a path.
 */
function offsetAt(index: number, count: number, curve: number): number {
  if (count < 2) return 0;
  return curve * Math.sin((2 * Math.PI * index) / (count - 1));
}

/**
 * Timeline
 * Milestones on a path: a line that bows from one to the next and fills up to
 * the last one reached, with each label in a pill on alternating sides.
 *
 * Design:
 * - Continuity (Gestalt): one curved line joins the milestones, so they read
 *   as a single path; the reached part of it is filled.
 * - Similarity + figure/ground: reached and pending milestones differ only by
 *   fill, so status reads at a glance.
 * - Common fate: when a milestone is reached the line travels there, gap by
 *   gap (in place with Reduce Motion).
 * - Fitts's law: with `onItemPress` the whole pill is the target.
 * - Screen readers: each milestone is checked or not; with `onItemPress` it
 *   is a button, disabled when `advance` doesn't let it respond.
 */
export const Timeline = memo(
  ({
    items,
    curve = DEFAULT_CURVE,
    spacing = DEFAULT_SPACING,
    startSide = 'right',
    glow = true,
    onItemPress,
    advance = 'free',
    selectedIndex,
    duration = DEFAULT_DURATION,
    style,
    testID,
  }: TimelineProps) => {
    const styles = useStyles();
    const colors = useColors();
    const allowFontScaling = useAllowFontScaling();
    const reduceMotion = useReduceMotion();

    const count = items.length;

    /**
     * How far the path has gotten, in milestone units. It is counted from the
     * start and cut at the first pending one: a milestone completed after one
     * that isn't doesn't move the line forward, because a path is a path.
     */
    const reached = useMemo(() => {
      let last = -1;
      for (let i = 0; i < items.length; i += 1) {
        if (items[i]?.status === 'pending') break;
        last = i;
      }
      return last;
    }, [items]);

    /**
     * High-water mark: except in 'free', the line stays at the furthest point
     * it reached. Progress belongs to the user, not the render — the parent
     * sending a shorter list can't undo the distance already covered.
     */
    const furthest = useRef(reached);
    if (advance === 'free') furthest.current = reached;
    else furthest.current = Math.max(furthest.current, reached);
    const lineTo = furthest.current;

    const progress = useRef(new Animated.Value(lineTo)).current;

    useEffect(() => {
      const animation = Animated.timing(progress, {
        toValue: lineTo,
        // One milestone per `duration`: advancing three at once takes three
        // times longer, so you see the path and not a jump.
        duration: reduceMotion ? 0 : duration,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      });
      animation.start();
      return () => animation.stop();
    }, [lineTo, duration, reduceMotion, progress]);

    /**
     * Each span split into short straight segments, each with its own length
     * and angle. It is the same idea as `Gradient`: the platform has no curves
     * without a native dependency, so the curve is composed from straight
     * pieces small enough for the eye not to see the break.
     */
    const pieces = useMemo(() => {
      const out: {
        key: string;
        x: number;
        y: number;
        length: number;
        angle: string;
        at: number;
        dotted: boolean;
      }[] = [];

      for (let i = 0; i < count - 1; i += 1) {
        for (let step = 0; step < SEGMENTS; step += 1) {
          const from = i + step / SEGMENTS;
          const to = i + (step + 1) / SEGMENTS;
          const x1 = offsetAt(from, count, curve);
          const x2 = offsetAt(to, count, curve);
          const y1 = from * spacing;
          const y2 = to * spacing;
          const dx = x2 - x1;
          const dy = y2 - y1;
          const length = Math.sqrt(dx * dx + dy * dy);

          out.push({
            key: `${i}-${step}`,
            x: (x1 + x2) / 2,
            y: (y1 + y2) / 2,
            length,
            // The segment is drawn vertically and rotated to the slope: the
            // angle is measured from the Y axis, not the X.
            angle: `${Math.atan2(dx, dy) * (180 / Math.PI) * -1}deg`,
            // Segment position measured in milestones: it is the same scale as
            // `progress`, so comparing one with the other is direct.
            at: to,
            dotted: step % DOT_EVERY === 0,
          });
        }
      }

      return out;
    }, [count, curve, spacing]);

    if (count === 0) return null;

    return (
      <View
        style={[
          styles.root,
          { height: count * spacing },
          style,
        ]}
        testID={testID}
      >
        <View style={styles.lineLayer} pointerEvents="none">
          {/* The whole path, dotted: it is what is left to travel. */}
          {pieces.map(
            (piece) =>
              piece.dotted && (
                <View
                  key={`dot-${piece.key}`}
                  style={[
                    styles.dot,
                    {
                      backgroundColor: colors.border,
                      top: spacing / 2 + piece.y - DOT / 2,
                      transform: [{ translateX: piece.x }],
                    },
                  ]}
                />
              )
          )}

          {/* And on top the solid line, revealed segment by segment as
              `progress` advances. The only thing that changes per frame is
              `opacity`, which means the path is drawn on the native thread. */}
          {pieces.map((piece) => (
            <Animated.View
              key={`line-${piece.key}`}
              style={[
                styles.segment,
                {
                  backgroundColor: colors.textLight,
                  height: piece.length,
                  top: spacing / 2 + piece.y - piece.length / 2,
                  opacity: progress.interpolate({
                    inputRange: [piece.at - FADE, piece.at],
                    outputRange: [0, 1],
                    extrapolate: 'clamp',
                  }),
                  transform: [{ translateX: piece.x }, { rotate: piece.angle }],
                },
              ]}
            />
          ))}

          {items.map((item, index) => (
            <View
              key={`node-${item.label}-${index}`}
              style={[
                styles.node,
                styles.nodePending,
                {
                  top: spacing / 2 + index * spacing - NODE / 2,
                  transform: [{ translateX: offsetAt(index, count, curve) }],
                },
              ]}
            >
              {/* The fill is a separate node on top of the hollow: color can't
                  be animated on the native thread, opacity can. */}
              <Animated.View
                style={[
                  styles.nodeFill,
                  {
                    backgroundColor: colors.textLight,
                    opacity: progress.interpolate({
                      inputRange: [index - FADE, index],
                      outputRange: [0, 1],
                      extrapolate: 'clamp',
                    }),
                    transform: [
                      {
                        scale: progress.interpolate({
                          inputRange: [index - FADE, index],
                          outputRange: [0.4, 1],
                          extrapolate: 'clamp',
                        }),
                      },
                    ],
                  },
                ]}
              />
            </View>
          ))}
        </View>

        {items.map((item, index) => {
          const pending = item.status === 'pending';
          const onRight = (index % 2 === 0) === (startSide === 'right');
          const offset = offsetAt(index, count, curve);
          // The whole row shifts with the curve, pill included, so the side it
          // moved toward loses that space against the edge. We give it back as
          // padding, plus what the halo sticks out: without this the outermost
          // pill gets clipped flush.
          const bleed = glow ? GLOW_BLEED : 0;
          const roomLeft = Math.max(0, -offset) + bleed;
          const roomRight = Math.max(0, offset) + bleed;

          const pill = (
            <View>
              {glow &&
                GLOW_LAYERS.map((layer) => (
                  <View
                    key={layer.inset}
                    pointerEvents="none"
                    style={[
                      styles.glow,
                      {
                        top: layer.inset,
                        bottom: layer.inset,
                        left: layer.inset,
                        right: layer.inset,
                        opacity: pending ? layer.opacity / 2 : layer.opacity,
                      },
                    ]}
                  />
                ))}
              <View style={[styles.pill, index === selectedIndex && styles.pillSelected]}>
                {item.emoji ? (
                  <Text allowFontScaling={allowFontScaling} style={styles.emoji}>
                    {item.emoji}
                  </Text>
                ) : (
                  !!item.iconName && (
                    <Icon name={item.iconName} size={16} color={pending ? colors.textLight : colors.text} />
                  )
                )}
                <Text allowFontScaling={allowFontScaling} style={[styles.label, pending && styles.labelPending]}>
                  {item.label}
                </Text>
              </View>
            </View>
          );

          // 'sequential' only allows tapping the next one; 'revisit' also the
          // ones already covered. The one that doesn't respond is marked as
          // disabled instead of staying silent: a button that does nothing
          // and doesn't say so is worse than a disabled button.
          const reachable =
            advance === 'sequential'
              ? index === lineTo + 1
              : advance === 'revisit'
                ? index <= lineTo + 1
                : true;

          const pressable = onItemPress ? (
            <PressableScale
              onPress={() => onItemPress(index)}
              disabled={!reachable}
              accessibilityRole="button"
              accessibilityLabel={item.label}
              accessibilityState={{ checked: !pending, disabled: !reachable, selected: index === selectedIndex }}
              testID={testID && `${testID}-press-${index}`}
            >
              {pill}
            </PressableScale>
          ) : (
            pill
          );

          return (
            <View
              key={`${item.label}-${index}`}
              testID={testID && `${testID}-item-${index}`}
              accessibilityRole={onItemPress ? undefined : 'text'}
              accessibilityLabel={onItemPress ? undefined : item.label}
              accessibilityState={onItemPress ? undefined : { checked: !pending }}
              style={[styles.row, { height: spacing, transform: [{ translateX: offset }] }]}
            >
              <View
                testID={testID && `${testID}-item-${index}-left`}
                style={[styles.side, styles.sideLeft, { paddingLeft: roomLeft }]}
              >
                {!onRight && pressable}
              </View>
              <View style={styles.nodeSlot} />
              <View
                testID={testID && `${testID}-item-${index}-right`}
                style={[styles.side, styles.sideRight, { paddingRight: roomRight }]}
              >
                {onRight && pressable}
              </View>
            </View>
          );
        })}
      </View>
    );
  }
);
Timeline.displayName = 'Timeline';
