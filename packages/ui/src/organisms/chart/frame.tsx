/**
 * Chart's frame: everything around the marks — grid, axes, legend and
 * tooltip. Nothing here knows the chart type; it receives numbers and texts
 * already resolved.
 *
 * Gestalt: the grid uses `border`, two steps below the series' color, so the
 * data stays as figure and the reference as ground. The legend repeats each
 * series' exact color (similarity), which is why it can act as a filter
 * control without explaining what it turns off: whatever has that color
 * turns off.
 */
import React, { memo } from 'react';
import { Text, TouchableOpacity, View, type StyleProp, type ViewStyle } from 'react-native';
import { createStyles } from '../../theme/createStyles';
import { useAllowFontScaling, useColors } from '../../theme/UIProvider';
import { polar, type Point } from './math';

const useStyles = createStyles((theme) => ({
  gridLine: { position: 'absolute', backgroundColor: theme.colors.border },
  axisLabel: {
    position: 'absolute',
    fontSize: theme.tokens.fontSize.xs,
    color: theme.colors.textLight,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: theme.tokens.spacing.sm,
    marginTop: theme.tokens.spacing.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.tokens.spacing.xs,
    paddingVertical: theme.tokens.spacing.xxs,
    paddingHorizontal: theme.tokens.spacing.sm,
    borderRadius: theme.tokens.radius.full,
    backgroundColor: theme.colors.inputBackground,
  },
  legendItemOff: { backgroundColor: 'transparent', borderWidth: 1, borderColor: theme.colors.border },
  swatch: { width: 10, height: 10, borderRadius: theme.tokens.radius.xs },
  legendLabel: { fontSize: theme.tokens.fontSize.xs, color: theme.colors.text },
  legendLabelOff: { color: theme.colors.textLight },
  tooltip: {
    position: 'absolute',
    paddingVertical: theme.tokens.spacing.sm,
    paddingHorizontal: theme.tokens.spacing.md,
    borderRadius: theme.tokens.radius.md,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: theme.tokens.spacing.xxs,
    ...theme.tokens.shadow.md,
  },
  tooltipTitle: {
    fontSize: theme.tokens.fontSize.xs,
    fontWeight: theme.tokens.fontWeight.semibold,
    color: theme.colors.text,
  },
  tooltipRow: { flexDirection: 'row', alignItems: 'center', gap: theme.tokens.spacing.xs },
  tooltipLabel: { fontSize: theme.tokens.fontSize.xs, color: theme.colors.textLight },
  tooltipValue: {
    fontSize: theme.tokens.fontSize.xs,
    fontWeight: theme.tokens.fontWeight.semibold,
    color: theme.colors.text,
    marginLeft: 'auto',
  },
}));

// ── grid and cartesian axes ────────────────────────────────────────────────

export interface CartesianGridProps {
  width: number;
  height: number;
  /** Pixel position of each line, along the axis perpendicular to it. */
  lines: number[];
  /** 'horizontal' draws lines running across the width (y axis with ticks). */
  orientation: 'horizontal' | 'vertical';
  /** Index of the zero line, more marked than the rest. */
  zeroIndex?: number;
  testID?: string;
}

export const CartesianGrid = memo(({ width, height, lines, orientation, zeroIndex, testID }: CartesianGridProps) => {
  const styles = useStyles();
  const colors = useColors();

  return (
    <View testID={testID} pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, width, height }}>
      {lines.map((position, index) => {
        const isZero = index === zeroIndex;
        return (
          <View
            key={index}
            style={[
              styles.gridLine,
              orientation === 'horizontal'
                ? { left: 0, width, top: position, height: 1 }
                : { top: 0, height, left: position, width: 1 },
              // The zero line is a different reference from the others: it
              // doesn't divide the space, it separates what adds from what subtracts.
              isZero && { backgroundColor: colors.textLight },
            ]}
          />
        );
      })}
    </View>
  );
});
CartesianGrid.displayName = 'CartesianGrid';

export interface AxisLabelsProps {
  labels: { text: string; position: number }[];
  /** 'x' spreads them across the width below the plot; 'y' stacks them on the left. */
  axis: 'x' | 'y';
  /** Width of the gutter reserved for the labels. */
  gutter: number;
  /** Size of the plot along the labels' axis. */
  span: number;
  testID?: string;
}

const LABEL_HEIGHT = 14;

export const AxisLabels = memo(({ labels, axis, gutter, span, testID }: AxisLabelsProps) => {
  const styles = useStyles();
  const allowFontScaling = useAllowFontScaling();
  // An x label is centered under its category and can overlap its neighbor;
  // it gets the plot's even share as its width and is truncated to one line.
  const slot = axis === 'x' ? Math.max(24, span / Math.max(1, labels.length)) : gutter;

  return (
    <View testID={testID} pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }}>
      {labels.map((label, index) => (
        <Text
          key={`${label.text}-${index}`}
          numberOfLines={1}
          allowFontScaling={allowFontScaling}
          style={[
            styles.axisLabel,
            axis === 'x'
              ? { left: label.position - slot / 2, width: slot, top: 0, textAlign: 'center' }
              : { left: 0, width: gutter, top: label.position - LABEL_HEIGHT / 2, height: LABEL_HEIGHT, textAlign: 'right' },
          ]}
        >
          {label.text}
        </Text>
      ))}
    </View>
  );
});
AxisLabels.displayName = 'AxisLabels';

// ── radar grid ─────────────────────────────────────────────────────────────

export interface RadarGridProps {
  center: Point;
  radius: number;
  angles: number[];
  /** Concentric rings, including the edge. */
  levels: number;
  testID?: string;
}

/**
 * The radar's rings and spokes. The rings are polygons, not circles: a circle
 * suggests there are values between one axis and the next, and there aren't —
 * there are only the axes that were passed in.
 */
export const RadarGrid = memo(({ center, radius, angles, levels, testID }: RadarGridProps) => {
  const colors = useColors();
  if (angles.length < 3 || radius <= 0) return null;

  const rings = Array.from({ length: levels }, (_, index) => (radius * (index + 1)) / levels);

  return (
    <View testID={testID} pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }}>
      {rings.map((ringRadius, ringIndex) => {
        const points = angles.map((angle) => polar(center, ringRadius, angle));
        return points.map((point, index) => {
          const next = points[(index + 1) % points.length]!;
          const dx = next.x - point.x;
          const dy = next.y - point.y;
          const length = Math.hypot(dx, dy);
          return (
            <View
              key={`ring-${ringIndex}-${index}`}
              style={{
                position: 'absolute',
                left: (point.x + next.x) / 2 - length / 2,
                top: (point.y + next.y) / 2 - 0.5,
                width: length,
                height: 1,
                backgroundColor: colors.border,
                transform: [{ rotate: `${(Math.atan2(dy, dx) * 180) / Math.PI}deg` }],
              }}
            />
          );
        });
      })}
      {angles.map((angle, index) => {
        const tip = polar(center, radius, angle);
        const dx = tip.x - center.x;
        const dy = tip.y - center.y;
        return (
          <View
            key={`spoke-${index}`}
            style={{
              position: 'absolute',
              left: (center.x + tip.x) / 2 - radius / 2,
              top: (center.y + tip.y) / 2 - 0.5,
              width: radius,
              height: 1,
              backgroundColor: colors.border,
              transform: [{ rotate: `${(Math.atan2(dy, dx) * 180) / Math.PI}deg` }],
            }}
          />
        );
      })}
    </View>
  );
});
RadarGrid.displayName = 'RadarGrid';

// ── legend ─────────────────────────────────────────────────────────────────

export interface LegendItem {
  key: string;
  label: string;
  color: string;
}

export interface LegendProps {
  items: LegendItem[];
  hidden: string[];
  /** Without this the legend is only a reference; with it, it is the filter. */
  onToggle?: (key: string) => void;
  testID?: string;
}

export const Legend = memo(({ items, hidden, onToggle, testID }: LegendProps) => {
  const styles = useStyles();
  const colors = useColors();
  const allowFontScaling = useAllowFontScaling();

  return (
    <View style={styles.legend} testID={testID}>
      {items.map((item) => {
        const off = hidden.includes(item.key);
        const content = (
          <>
            <View style={[styles.swatch, { backgroundColor: off ? colors.border : item.color }]} />
            <Text allowFontScaling={allowFontScaling} style={[styles.legendLabel, off && styles.legendLabelOff]}>
              {item.label}
            </Text>
          </>
        );

        if (!onToggle) {
          return (
            <View key={item.key} style={styles.legendItem} testID={testID && `${testID}-${item.key}`}>
              {content}
            </View>
          );
        }
        return (
          <TouchableOpacity
            key={item.key}
            style={[styles.legendItem, off && styles.legendItemOff]}
            onPress={() => onToggle(item.key)}
            accessibilityRole="switch"
            accessibilityState={{ checked: !off }}
            accessibilityLabel={item.label}
            testID={testID && `${testID}-${item.key}`}
          >
            {content}
          </TouchableOpacity>
        );
      })}
    </View>
  );
});
Legend.displayName = 'Legend';

// ── tooltip ────────────────────────────────────────────────────────────────

export interface TooltipRow {
  key: string;
  label: string;
  value: string;
  color: string;
}

export interface TooltipProps {
  title: string;
  rows: TooltipRow[];
  /** The point it describes, in container coordinates. */
  anchor: Point;
  /** Available width: the bubble shifts so it doesn't spill out. */
  containerWidth: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const TOOLTIP_WIDTH = 148;
const TOOLTIP_GAP = 10;
/** Estimated bubble height: the real one isn't known until it's measured, and
 *  measuring it to decide where to put it would make it show up shifted for a frame. */
const TOOLTIP_TITLE = 22;
const TOOLTIP_ROW = 17;

export const Tooltip = memo(({ title, rows, anchor, containerWidth, style, testID }: TooltipProps) => {
  const styles = useStyles();
  const allowFontScaling = useAllowFontScaling();
  // Clamp instead of flip: moving it to the other side of the finger makes it
  // jump sides while dragging, and the jump reads as a bug.
  const left = Math.max(0, Math.min(containerWidth - TOOLTIP_WIDTH, anchor.x - TOOLTIP_WIDTH / 2));
  // It goes above the point, unless there is no room: then it goes below,
  // because getting cut off against the top edge makes it unreadable.
  const estimated = TOOLTIP_TITLE + rows.length * TOOLTIP_ROW;
  const above = anchor.y - TOOLTIP_GAP - estimated;
  const top = above >= 0 ? above : anchor.y + TOOLTIP_GAP;

  return (
    <View
      testID={testID}
      pointerEvents="none"
      accessibilityRole="alert"
      style={[styles.tooltip, { left, width: TOOLTIP_WIDTH, top }, style]}
    >
      <Text allowFontScaling={allowFontScaling} style={styles.tooltipTitle}>
        {title}
      </Text>
      {rows.map((row) => (
        <View key={row.key} style={styles.tooltipRow}>
          <View style={[styles.swatch, { backgroundColor: row.color }]} />
          <Text allowFontScaling={allowFontScaling} numberOfLines={1} style={styles.tooltipLabel}>
            {row.label}
          </Text>
          <Text allowFontScaling={allowFontScaling} style={styles.tooltipValue}>
            {row.value}
          </Text>
        </View>
      ))}
    </View>
  );
});
Tooltip.displayName = 'Tooltip';
