import React, { memo, useMemo, useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native';

export type GradientDirection = 'vertical' | 'horizontal' | 'diagonal' | 'diagonal-reverse';

export interface GradientProps {
  /** Gradient stops. A single color paints flat; none paints nothing. */
  colors: string[];
  /**
   * 'vertical' runs top to bottom, 'horizontal' left to right, 'diagonal'
   * top-left to bottom-right and 'diagonal-reverse' top-right to bottom-left.
   * @default 'vertical'
   */
  direction?: GradientDirection;
  /**
   * Bands per segment (a segment = a pair of consecutive colors). More bands
   * = a smoother transition and more views in the tree.
   * @default 48
   */
  steps?: number;
  /** Content rendered on top of the gradient. */
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const DEFAULT_STEPS = 48;

const styles = StyleSheet.create({
  // Clips the rotated plane of the diagonals and the gradient to the borderRadius.
  root: { overflow: 'hidden' },
  // Centered √2 plane: covers the corners of a SQUARE container without
  // measuring it. Only used until the first onLayout; after that the plane is
  // sized with the real diagonal (see `diagonalBox`).
  diagonalPlane: { position: 'absolute', top: '-21%', left: '-21%', width: '142%', height: '142%' },
});

/**
 * Opacities of stacked layers: layer k (from 1 to n-1) starts at k/n and
 * runs to the end of the segment; stacked with "over", the total opacity in
 * band k is k/(n-1), same as side-by-side bands. The difference: no layer
 * edge sits next to a gap, so the antialiasing of an edge (especially when
 * rotated) blends with the color of the layer below and not with what is
 * behind the gradient — without the thin lines between bands.
 */
function layerOpacities(n: number): number[] {
  const out: number[] = [];
  let prev = 0;
  for (let k = 1; k < n; k += 1) {
    const total = k / (n - 1);
    out.push(prev >= 1 ? 1 : 1 - (1 - total) / (1 - prev));
    prev = total;
  }
  return out;
}

/** Square with the diagonal as its side, centered: rotated 45° it covers any rectangle. */
function diagonalBox(width: number, height: number): ViewStyle {
  const side = Math.hypot(width, height);
  return { position: 'absolute', width: side, height: side, left: (width - side) / 2, top: (height - side) / 2 };
}

/**
 * Gradient
 * Dependency-free linear gradient: React Native doesn't ship one in the
 * supported range (Expo SDK 54–57) and `experimental_backgroundImage` isn't
 * available across that whole window, so it is composed from bands.
 *
 * Each segment paints the start color and, on top, layers of the end color
 * that accumulate (see `layerOpacities`). The compositor blends alpha linearly:
 * the result is the sRGB interpolation between stops without parsing the
 * color, which is why any format RN accepts works (hex, `rgba()`, name). The
 * layers run to the end of the plane so no thin lines are left between
 * bands, and the diagonals rotate a square the size of the measured diagonal
 * to cover any rectangle, not just squares.
 *
 * Gestalt, figure and ground: content on top must contrast with ALL the
 * stops, not just the first — white text that reads well over the blue at
 * the start can get lost over the light blue at the end.
 */
export const Gradient = memo(
  ({ colors, direction = 'vertical', steps = DEFAULT_STEPS, children, style, testID }: GradientProps) => {
    const isRow = direction === 'horizontal';
    const isDiagonal = direction === 'diagonal' || direction === 'diagonal-reverse';
    // positive rotate turns clockwise (Y grows downward): -45° sends the
    // gradient axis down-right.
    const rotate = direction === 'diagonal' ? '-45deg' : '45deg';
    const bandCount = Math.max(2, Math.floor(steps));
    const [size, setSize] = useState<{ width: number; height: number } | null>(null);
    const onLayout = isDiagonal
      ? (e: LayoutChangeEvent) => {
          const { width, height } = e.nativeEvent.layout;
          setSize((prev) => (prev && prev.width === width && prev.height === height ? prev : { width, height }));
        }
      : undefined;

    const painted = useMemo(() => {
      if (colors.length === 0) return null;
      if (colors.length === 1) {
        return <View style={[StyleSheet.absoluteFill, { backgroundColor: colors[0] }]} />;
      }

      const segmentCount = colors.length - 1;
      const opacities = layerOpacities(bandCount);
      // From `start` (fraction of the axis) to the end of the plane.
      const from = (start: number): ViewStyle =>
        isRow
          ? { position: 'absolute', top: 0, bottom: 0, right: 0, left: `${start * 100}%` }
          : { position: 'absolute', left: 0, right: 0, bottom: 0, top: `${start * 100}%` };

      // Segments are stacked too: each one covers the previous from its start,
      // and since it begins with the color the previous one ended with, the
      // edge between segments doesn't show the background.
      const segments = colors.slice(0, -1).map((start, index) => {
        const to = colors[index + 1] as string;
        const segStart = index / segmentCount;
        const segLength = 1 / segmentCount;
        // The segment runs from segStart to the END of the plane; its layers
        // sit at fractions of that remaining length.
        const rest = 1 - segStart;
        return (
          <View key={`${start}-${to}-${index}`} style={[from(segStart), { backgroundColor: start }]}>
            {opacities.map((opacity, k) => (
              <View
                key={k}
                style={[from((((k + 1) / bandCount) * segLength) / rest), { backgroundColor: to, opacity }]}
              />
            ))}
          </View>
        );
      });

      if (!isDiagonal) return <View style={StyleSheet.absoluteFill}>{segments}</View>;
      const plane = size ? diagonalBox(size.width, size.height) : styles.diagonalPlane;
      return <View style={[plane, { transform: [{ rotate }] }]}>{segments}</View>;
    }, [colors, isRow, isDiagonal, rotate, bandCount, size]);

    return (
      <View testID={testID} style={[styles.root, style]} onLayout={onLayout}>
        {/* pointerEvents goes on the painted layer, not the root: the gradient
            must not steal touches from whatever the consumer places on top. */}
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          {painted}
        </View>
        {children}
      </View>
    );
  }
);
Gradient.displayName = 'Gradient';
