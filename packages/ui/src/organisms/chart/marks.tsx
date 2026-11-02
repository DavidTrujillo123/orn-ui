/**
 * Chart's marks: the only thing the component knows how to draw.
 *
 * React Native ships no vector canvas and the library can't add one (zero
 * dependencies), so the three primitives here are composed from `View` and
 * are enough for the six chart types:
 *
 * | primitive  | used by                                             |
 * |------------|-----------------------------------------------------|
 * | `Bar`      | vertical and horizontal bars, grouped or stacked     |
 * | `Polyline` | line, radar outline, radar grid, axes                |
 * | `Wedge`    | pie, donut and the radar fill                        |
 *
 * They are pure: they don't listen to touches or know the scale. What handles
 * touches is Chart.tsx's hit-test layer, which covers whole columns instead of
 * the mark — a 2px line is not a touch target.
 */
import React, { memo, useEffect, useRef } from 'react';
import { Animated, Easing, View, type ViewStyle } from 'react-native';
import { segmentBox, type Point } from './math';

/**
 * A value that chases `target` instead of jumping. A filter that changes the
 * data moves the bar from where it was, and that movement is what says "it's
 * the same bar with another number" instead of "it's another chart".
 */
export function useAnimatedNumber(target: number, animate: boolean, duration: number): Animated.Value {
  const value = useRef(new Animated.Value(animate ? 0 : target)).current;

  useEffect(() => {
    if (!animate) {
      value.setValue(target);
      return;
    }
    const animation = Animated.timing(value, {
      toValue: target,
      duration,
      easing: Easing.out(Easing.cubic),
      // Geometry, not transform: `height`/`top` are layout props and the
      // native driver doesn't touch them. It is the price of letting the bar
      // grow from its base with negative values without recomputing the origin.
      useNativeDriver: false,
    });
    animation.start();
    return () => animation.stop();
  }, [target, animate, duration, value]);

  return value;
}

// ── bar ────────────────────────────────────────────────────────────────────

export interface BarProps {
  /** The bar's final box inside the plot, already in pixels. */
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  /** Side it grows from: the bar grows from its base, not from the center. */
  from: 'bottom' | 'top' | 'left' | 'right';
  /** Radius of the two corners at the free end. */
  radius?: number;
  /** Dims the bars that aren't the selected one. */
  dim?: boolean;
  animate?: boolean;
  duration?: number;
  testID?: string;
}

const DIM_OPACITY = 0.32;

export const Bar = memo(
  ({ x, y, width, height, color, from, radius = 0, dim = false, animate = true, duration = 400, testID }: BarProps) => {
    const vertical = from === 'bottom' || from === 'top';
    const grown = useAnimatedNumber(vertical ? height : width, animate, duration);

    // The end that moves is the one opposite the base: a bar growing from
    // the bottom keeps its lower edge fixed and raises the upper one.
    const box = vertical
      ? { left: x, width, height: grown, ...(from === 'bottom' ? { bottom: y } : { top: y }) }
      : { top: y, height, width: grown, ...(from === 'left' ? { left: x } : { right: x }) };

    const corners: ViewStyle =
      radius <= 0
        ? {}
        : from === 'bottom'
          ? { borderTopLeftRadius: radius, borderTopRightRadius: radius }
          : from === 'top'
            ? { borderBottomLeftRadius: radius, borderBottomRightRadius: radius }
            : from === 'left'
              ? { borderTopRightRadius: radius, borderBottomRightRadius: radius }
              : { borderTopLeftRadius: radius, borderBottomLeftRadius: radius };

    return (
      <Animated.View
        testID={testID}
        pointerEvents="none"
        style={[{ position: 'absolute', backgroundColor: color, opacity: dim ? DIM_OPACITY : 1 }, corners, box]}
      />
    );
  }
);
Bar.displayName = 'Bar';

// ── polyline ───────────────────────────────────────────────────────────────

export interface PolylineProps {
  points: Point[];
  color: string;
  thickness?: number;
  /** Joins the last point with the first (radar, polygonal grid). */
  closed?: boolean;
  opacity?: number;
  testID?: string;
}

/**
 * A line is a thin rectangle rotated around its center, one per segment. With
 * `smoothPoints` there are so many segments that the polyline reads as a curve.
 *
 * The ends are butt, not rounded: a `borderRadius` per segment would multiply
 * the views and at 2px thick nobody sees the difference.
 */
export const Polyline = memo(({ points, color, thickness = 2, closed = false, opacity = 1, testID }: PolylineProps) => {
  if (points.length < 2) return null;
  const path = closed ? [...points, points[0]!] : points;

  return (
    <View testID={testID} pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, opacity }}>
      {path.slice(0, -1).map((point, index) => {
        const box = segmentBox(point, path[index + 1]!, thickness);
        return (
          <View
            key={index}
            style={{
              position: 'absolute',
              left: box.left,
              top: box.top,
              width: box.width,
              height: box.height,
              backgroundColor: color,
              transform: [{ rotate: `${box.rotate}deg` }],
            }}
          />
        );
      })}
    </View>
  );
});
Polyline.displayName = 'Polyline';

export interface DotProps {
  point: Point;
  color: string;
  size?: number;
  /** Ring in the background color: separates the dot from the line crossing it. */
  ringColor?: string;
  ringWidth?: number;
  testID?: string;
}

export const Dot = memo(({ point, color, size = 7, ringColor, ringWidth = 2, testID }: DotProps) => {
  const outer = size + (ringColor ? ringWidth * 2 : 0);
  return (
    <View
      testID={testID}
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: point.x - outer / 2,
        top: point.y - outer / 2,
        width: outer,
        height: outer,
        borderRadius: outer / 2,
        backgroundColor: color,
        borderWidth: ringColor ? ringWidth : 0,
        borderColor: ringColor,
      }}
    />
  );
});
Dot.displayName = 'Dot';

// ── slice ──────────────────────────────────────────────────────────────────

interface HalfProps {
  size: number;
  /** Opening of this half, 0–180. */
  sweep: number;
  color: string;
}

/**
 * Sector of up to 180°, without curves or masks. Three boxes:
 *
 * 1. a fixed clip to the right half (`overflow: 'hidden'`), which is the
 *    0°–180° sector;
 * 2. inside, a `size` × `size` square centered on the circle's center, which
 *    is what rotates — rotating around its own center, it rotates around the
 *    circle's center without needing `transformOrigin`;
 * 3. inside the square, a **half disc**, not a whole disc: a half-box
 *    rectangle with its two outer corners rounded to the radius.
 *
 * The half disc is what makes the rotation mean something. With a full disc
 * the clip always leaves the same half moon —rotating a solid circle doesn't
 * change it—, and every slice, whether 5° or 180°, comes out equally wide:
 * 180°.
 *
 * Rotated `sweep - 180`, the half disc covers `sweep - 180` to `sweep`, and
 * what survives the clip is exactly 0°–`sweep`.
 */
const Half = ({ size, sweep, color }: HalfProps) => (
  <View style={{ position: 'absolute', left: size / 2, top: 0, width: size / 2, height: size, overflow: 'hidden' }}>
    <View
      style={{
        position: 'absolute',
        left: -size / 2,
        top: 0,
        width: size,
        height: size,
        transform: [{ rotate: `${sweep - 180}deg` }],
      }}
    >
      <View
        style={{
          position: 'absolute',
          left: size / 2,
          top: 0,
          width: size / 2,
          height: size,
          backgroundColor: color,
          borderTopRightRadius: size / 2,
          borderBottomRightRadius: size / 2,
        }}
      />
    </View>
  </View>
);

export interface WedgeProps {
  /** Diameter: the slice is drawn centered in a `size` × `size` box. */
  size: number;
  /** Angle where it starts, 0° at the top and increasing clockwise. */
  start: number;
  /** Apertura, 0–360. */
  sweep: number;
  color: string;
  opacity?: number;
  /** Pushes the slice outward along its bisector (the selected one). */
  explode?: number;
  /** Center within the container. Without it the slice rests on (0, 0). */
  center?: Point;
  testID?: string;
}

const FULL_CIRCLE = 359.9;

export const Wedge = memo(({ size, start, sweep, color, opacity = 1, explode = 0, center, testID }: WedgeProps) => {
  if (sweep <= 0 || size <= 0) return null;
  // Exactly 360° leaves both halves at 180°, and the top one covers the bottom
  // one with an antialias slit. A hair less isn't visible and doesn't happen.
  const total = Math.min(sweep, FULL_CIRCLE);
  const first = Math.min(total, 180);
  const second = total - first;
  const bisector = (start + total / 2) * (Math.PI / 180);

  return (
    <View
      testID={testID}
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: (center?.x ?? size / 2) - size / 2,
        top: (center?.y ?? size / 2) - size / 2,
        width: size,
        height: size,
        opacity,
        transform: [
          { translateX: explode * Math.sin(bisector) },
          { translateY: -explode * Math.cos(bisector) },
          { rotate: `${start}deg` },
        ],
      }}
    >
      <Half size={size} sweep={first} color={color} />
      {second > 0 ? (
        <View style={{ position: 'absolute', width: size, height: size, transform: [{ rotate: '180deg' }] }}>
          <Half size={size} sweep={second} color={color} />
        </View>
      ) : null}
    </View>
  );
});
Wedge.displayName = 'Wedge';
