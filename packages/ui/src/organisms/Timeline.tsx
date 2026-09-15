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
 * Qué puede hacer un toque.
 * - 'free': cualquier hito responde y la línea sigue a `items` para donde
 *   vaya, adelante o atrás. Es el que sirve cuando el recorrido no es un
 *   progreso, o cuando lo maneja otra cosa.
 * - 'sequential': sólo responde el que sigue al alcanzado, y la línea no
 *   retrocede nunca. Avance estricto.
 * - 'revisit': responden el que sigue y todos los ya alcanzados, y la línea
 *   tampoco retrocede. Es el caso de "puedo volver a mirar lo anterior sin
 *   perder lo que llevo".
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
/** Tramos rectos por cada vano: con menos, la curva se ve poligonal. */
const SEGMENTS = 14;
const DOT = 3;
/** Un punto cada cuántos tramos: el camino entero va punteado por debajo. */
const DOT_EVERY = 2;
const DEFAULT_DURATION = 420;
/**
 * Cuánto tarda un tramo en encenderse, medido en hitos. Chico para que el
 * frente de la línea se lea como un borde y no como un degradado largo.
 */
const FADE = 0.06;
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
    position: 'absolute',
    width: NODE,
    height: NODE,
    borderRadius: NODE / 2,
    borderWidth: LINE,
  },
  nodePending: { backgroundColor: 'transparent', borderColor: theme.colors.border },
  // Ocupa el círculo entero menos el borde, así el relleno no lo tapa.
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
    backgroundColor: theme.colors.surface,
  },
  // El foco se marca con el borde, no con el relleno: el relleno ya está
  // diciendo otra cosa (si el hito está alcanzado o no).
  pillSelected: { borderColor: theme.colors.primary, borderWidth: 2 },
  label: { fontSize: theme.tokens.fontSize.md, color: theme.colors.text },
  labelPending: { color: theme.colors.textLight },
  emoji: { fontSize: theme.tokens.fontSize.md },
  glow: {
    position: 'absolute',
    borderRadius: theme.tokens.radius.full,
    backgroundColor: theme.colors.text,
  },
  // La línea y los nodos viven en la misma capa y se posicionan con las mismas
  // coordenadas. Es lo único que garantiza que el círculo caiga sobre la
  // curva: en el flujo de la fila el nodo lo corre el flex —y los paddings que
  // cada lado necesita para no cortar su píldora—, así que terminaba a un
  // costado de la línea en vez de encima.
  lineLayer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center' },
  // Hueco del ancho del nodo en la fila: la píldora se separa del centro lo
  // mismo que antes, pero el círculo ya no se dibuja acá.
  nodeSlot: { width: NODE },
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
     * Hasta dónde llegó el recorrido, en unidades de hito. Se cuenta desde el
     * principio y se corta en el primer pendiente: un hito cumplido después de
     * uno que no lo está no adelanta la línea, porque el camino es un camino.
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
     * Marca de agua: salvo en 'free', la línea se queda en lo más lejos que
     * llegó. El progreso es del usuario, no del render — que el padre mande
     * una lista más corta no puede desandar lo que ya recorrió.
     */
    const furthest = useRef(reached);
    if (advance === 'free') furthest.current = reached;
    else furthest.current = Math.max(furthest.current, reached);
    const lineTo = furthest.current;

    const progress = useRef(new Animated.Value(lineTo)).current;

    useEffect(() => {
      const animation = Animated.timing(progress, {
        toValue: lineTo,
        // Un hito por `duration`: avanzar tres de una vez tarda tres veces
        // más, así se ve el recorrido y no un salto.
        duration: reduceMotion ? 0 : duration,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      });
      animation.start();
      return () => animation.stop();
    }, [lineTo, duration, reduceMotion, progress]);

    /**
     * Cada vano partido en tramos rectos cortos, cada uno con su largo y su
     * ángulo. Es la misma idea que `Gradient`: la plataforma no tiene curvas
     * sin dependencia nativa, así que la curva se compone con pedazos rectos
     * lo bastante chicos como para que el ojo no vea el quiebre.
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
            // El tramo se dibuja vertical y se gira hasta la pendiente: el
            // ángulo se mide desde el eje Y, no desde el X.
            angle: `${Math.atan2(dx, dy) * (180 / Math.PI) * -1}deg`,
            // Posición del tramo medida en hitos: es la misma escala que
            // `progress`, así que comparar una cosa con la otra es directo.
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
          {/* El camino entero, punteado: es lo que falta recorrer. */}
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

          {/* Y encima la línea llena, que se revela tramo a tramo a medida que
              `progress` avanza. Lo único que cambia por frame es `opacity`, o
              sea que el recorrido se dibuja en el hilo nativo. */}
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
              {/* El relleno es un nodo aparte encima del hueco: el color no se
                  puede animar en el hilo nativo, la opacidad sí. */}
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

          // 'sequential' deja tocar sólo el que sigue; 'revisit' también los
          // ya recorridos. El que no responde se marca como deshabilitado en
          // vez de quedarse mudo: un botón que no hace nada y no lo dice es
          // peor que un botón apagado.
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
