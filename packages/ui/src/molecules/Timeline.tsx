import React, { memo, useMemo } from 'react';
import { Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { createStyles } from '../theme/createStyles';
import { useAllowFontScaling, useColors } from '../theme/UIProvider';
import { Icon } from '../icons/Icon';
import type { IconName } from '../icons/types';

export type TimelineStatus = 'done' | 'pending';

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
  items: TimelineItem[];
  /** Pixels the line bows away from the straight path. 0 draws it straight. @default 28 */
  curve?: number;
  /** Vertical distance between one node and the next. @default 84 */
  spacing?: number;
  /** Side the first pill goes to; the rest alternate. @default 'right' */
  startSide?: 'left' | 'right';
  /** Halo behind each pill. @default true */
  glow?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const DEFAULT_CURVE = 28;
const DEFAULT_SPACING = 84;
const NODE = 14;
const LINE = 2;
/** Tramos rectos por cada vano: con menos, la curva se ve poligonal. */
const SEGMENTS = 14;
const DOT = 3;
/** Un punto cada cuántos tramos, en el trecho pendiente. */
const DOT_EVERY = 2;
/**
 * Capas del halo, de afuera hacia adentro. Son muchas y muy tenues a
 * propósito: con tres capas se ven los anillos, que es justo lo contrario de
 * un difuminado. Cuantos más escalones y más chico el salto de opacidad, más
 * cerca queda de un degradado.
 */
/** Lo que el halo sobresale de la píldora: es lo que hay que dejarle de aire. */
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
    width: NODE,
    height: NODE,
    borderRadius: NODE / 2,
    borderWidth: LINE,
  },
  nodeDone: { backgroundColor: theme.colors.textLight, borderColor: theme.colors.textLight },
  nodePending: { backgroundColor: 'transparent', borderColor: theme.colors.border },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.tokens.spacing.sm,
    paddingVertical: theme.tokens.spacing.sm,
    paddingHorizontal: theme.tokens.spacing.lg,
    borderRadius: theme.tokens.radius.full,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  label: { fontSize: theme.tokens.fontSize.md, color: theme.colors.text },
  labelPending: { color: theme.colors.textLight },
  emoji: { fontSize: theme.tokens.fontSize.md },
  glow: {
    position: 'absolute',
    borderRadius: theme.tokens.radius.full,
    backgroundColor: theme.colors.text,
  },
  // La línea vive detrás de todo y se dibuja con coordenadas propias, así los
  // tramos de un vano y del siguiente empalman sin depender del layout de las
  // filas.
  lineLayer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center' },
  segment: { position: 'absolute', width: LINE },
  dot: { position: 'absolute', width: DOT, height: DOT, borderRadius: DOT / 2 },
}));

/**
 * Desvío horizontal del nodo `index` respecto del eje. Una onda entera a lo
 * largo de la lista: el primero y el último caen sobre el eje, y los del medio
 * se van a un lado y al otro. Es lo que convierte una columna en un camino.
 */
function offsetAt(index: number, count: number, curve: number): number {
  if (count < 2) return 0;
  return curve * Math.sin((2 * Math.PI * index) / (count - 1));
}

export const Timeline = memo(
  ({
    items,
    curve = DEFAULT_CURVE,
    spacing = DEFAULT_SPACING,
    startSide = 'right',
    glow = true,
    style,
    testID,
  }: TimelineProps) => {
    const styles = useStyles();
    const colors = useColors();
    const allowFontScaling = useAllowFontScaling();

    const count = items.length;

    /**
     * Cada vano partido en tramos rectos cortos, cada uno con su largo y su
     * ángulo. Es la misma idea que `Gradient`: la plataforma no tiene curvas
     * sin dependencia nativa, así que la curva se compone con pedazos rectos
     * lo bastante chicos como para que el ojo no vea el quiebre.
     */
    const pieces = useMemo(() => {
      const out: { key: string; x: number; y: number; length: number; angle: string; pending: boolean }[] = [];

      for (let i = 0; i < count - 1; i += 1) {
        // Un vano es pendiente apenas lo es alguno de sus extremos: el trecho
        // punteado tiene que arrancar en el último hito cumplido, no después.
        const pending = items[i]?.status === 'pending' || items[i + 1]?.status === 'pending';

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
            // El tramo se dibuja vertical y se gira hasta la pendiente: el
            // ángulo se mide desde el eje Y, no desde el X.
            angle: `${Math.atan2(dx, dy) * (180 / Math.PI) * -1}deg`,
            pending,
          });
        }
      }

      return out;
    }, [items, count, curve, spacing]);

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
          {pieces.map((piece) =>
            piece.pending ? (
              Number(piece.key.split('-')[1]) % DOT_EVERY === 0 && (
                <View
                  key={piece.key}
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
            ) : (
              <View
                key={piece.key}
                style={[
                  styles.segment,
                  {
                    backgroundColor: colors.textLight,
                    height: piece.length,
                    top: spacing / 2 + piece.y - piece.length / 2,
                    transform: [{ translateX: piece.x }, { rotate: piece.angle }],
                  },
                ]}
              />
            )
          )}
        </View>

        {items.map((item, index) => {
          const pending = item.status === 'pending';
          const onRight = (index % 2 === 0) === (startSide === 'right');
          const offset = offsetAt(index, count, curve);
          // La fila entera se corre con la curva, píldora incluida, así que el
          // lado hacia el que se fue pierde ese espacio contra el borde. Se lo
          // devolvemos como padding, más lo que sobresale el halo: sin esto la
          // píldora de más afuera queda cortada al ras.
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
              <View style={styles.pill}>
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

          return (
            <View
              key={`${item.label}-${index}`}
              testID={testID && `${testID}-item-${index}`}
              accessibilityRole="text"
              accessibilityLabel={item.label}
              accessibilityState={{ checked: !pending }}
              style={[styles.row, { height: spacing, transform: [{ translateX: offset }] }]}
            >
              <View
                testID={testID && `${testID}-item-${index}-left`}
                style={[styles.side, styles.sideLeft, { paddingLeft: roomLeft }]}
              >
                {!onRight && pill}
              </View>
              <View style={[styles.node, pending ? styles.nodePending : styles.nodeDone]} />
              <View
                testID={testID && `${testID}-item-${index}-right`}
                style={[styles.side, styles.sideRight, { paddingRight: roomRight }]}
              >
                {onRight && pill}
              </View>
            </View>
          );
        })}
      </View>
    );
  }
);
Timeline.displayName = 'Timeline';
