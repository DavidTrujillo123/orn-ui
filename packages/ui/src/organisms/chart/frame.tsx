/**
 * El marco de Chart: todo lo que rodea a las marcas — grilla, ejes, leyenda y
 * tooltip. Nada de acá conoce el tipo de chart; recibe números y textos ya
 * resueltos.
 *
 * Gestalt: la grilla usa `border`, dos escalones por debajo del color de las
 * series, para que el dato quede como figura y la referencia como fondo. La
 * leyenda repite el color exacto de cada serie (similitud) y por eso puede
 * hacer de control de filtro sin explicar qué apaga: se apaga lo que tiene ese
 * color.
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

// ── grilla y ejes cartesianos ──────────────────────────────────────────────

export interface CartesianGridProps {
  width: number;
  height: number;
  /** Posición en píxeles de cada línea, sobre el eje perpendicular a ella. */
  lines: number[];
  /** 'horizontal' dibuja líneas que cruzan a lo ancho (eje y con ticks). */
  orientation: 'horizontal' | 'vertical';
  /** Índice de la línea del cero, más marcada que el resto. */
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
              // La línea del cero es una referencia distinta de las demás: no
              // divide el espacio, separa lo que suma de lo que resta.
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
  /** 'x' las reparte a lo ancho debajo del plot; 'y' las apila a la izquierda. */
  axis: 'x' | 'y';
  /** Ancho del canal reservado para las etiquetas. */
  gutter: number;
  /** Tamaño del plot sobre el eje de las etiquetas. */
  span: number;
  testID?: string;
}

const LABEL_HEIGHT = 14;

export const AxisLabels = memo(({ labels, axis, gutter, span, testID }: AxisLabelsProps) => {
  const styles = useStyles();
  const allowFontScaling = useAllowFontScaling();
  // Una etiqueta de x se centra bajo su categoría y puede pisar a la vecina;
  // se le da como ancho el reparto parejo del plot y se trunca a una línea.
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

// ── grilla del radar ───────────────────────────────────────────────────────

export interface RadarGridProps {
  center: Point;
  radius: number;
  angles: number[];
  /** Anillos concéntricos, incluido el borde. */
  levels: number;
  testID?: string;
}

/**
 * Anillos y radios del radar. Los anillos son polígonos, no círculos: un
 * círculo sugiere que entre eje y eje hay valores, y no los hay — sólo hay
 * los ejes que se pasaron.
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

// ── leyenda ────────────────────────────────────────────────────────────────

export interface LegendItem {
  key: string;
  label: string;
  color: string;
}

export interface LegendProps {
  items: LegendItem[];
  hidden: string[];
  /** Sin esto la leyenda es sólo referencia; con esto es el filtro. */
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
  /** Punto que describe, en coordenadas del contenedor. */
  anchor: Point;
  /** Ancho disponible: el globo se corre para no salirse. */
  containerWidth: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const TOOLTIP_WIDTH = 148;
const TOOLTIP_GAP = 10;
/** Alto estimado del globo: el real no se sabe hasta después de medirlo, y
 *  medirlo para decidir dónde ponerlo lo haría aparecer corrido un frame. */
const TOOLTIP_TITLE = 22;
const TOOLTIP_ROW = 17;

export const Tooltip = memo(({ title, rows, anchor, containerWidth, style, testID }: TooltipProps) => {
  const styles = useStyles();
  const allowFontScaling = useAllowFontScaling();
  // Clamp en vez de flip: moverlo al otro lado del dedo hace que salte de lado
  // mientras se arrastra, y el salto se lee como un error.
  const left = Math.max(0, Math.min(containerWidth - TOOLTIP_WIDTH, anchor.x - TOOLTIP_WIDTH / 2));
  // Va arriba del punto, salvo que no haya lugar: ahí baja, porque taparse
  // contra el borde superior lo deja ilegible.
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
