/**
 * Las marcas de Chart: lo único que sabe dibujar el componente.
 *
 * React Native no trae un lienzo vectorial y la librería no puede agregar uno
 * (cero dependencias), así que las tres primitivas de acá se componen con
 * `View` y bastan para los seis tipos de chart:
 *
 * | primitiva  | la usan                                             |
 * |------------|-----------------------------------------------------|
 * | `Bar`      | barras verticales y horizontales, agrupadas o apiladas |
 * | `Polyline` | línea, contorno del radar, grilla del radar, ejes    |
 * | `Wedge`    | torta, dona y el relleno del radar                   |
 *
 * Son puras: no escuchan toques ni conocen la escala. Quien toca es la capa de
 * hit-test de Chart.tsx, que cubre columnas enteras en vez de la marca —
 * una línea de 2px no es un blanco táctil.
 */
import React, { memo, useEffect, useRef } from 'react';
import { Animated, Easing, View, type ViewStyle } from 'react-native';
import { segmentBox, type Point } from './math';

/**
 * Valor que persigue a `target` en vez de saltar. Un filtro que cambia los
 * datos mueve la barra desde donde estaba, y ese movimiento es lo que dice
 * "es la misma barra con otro número" en lugar de "es otro chart".
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
      // Geometría, no transform: `height`/`top` son props de layout y el
      // driver nativo no las toca. Es el precio de que la barra pueda crecer
      // desde su base con valores negativos sin recalcular el origen.
      useNativeDriver: false,
    });
    animation.start();
    return () => animation.stop();
  }, [target, animate, duration, value]);

  return value;
}

// ── barra ──────────────────────────────────────────────────────────────────

export interface BarProps {
  /** Caja final de la barra dentro del plot, ya en píxeles. */
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  /** Lado por donde nace: la barra crece desde su base, no desde el centro. */
  from: 'bottom' | 'top' | 'left' | 'right';
  /** Radio de las dos esquinas del extremo libre. */
  radius?: number;
  /** Atenúa las barras que no son la seleccionada. */
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

    // El extremo que se mueve es el opuesto a la base: una barra que nace
    // abajo mantiene fijo su borde inferior y sube el superior.
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

// ── polilínea ──────────────────────────────────────────────────────────────

export interface PolylineProps {
  points: Point[];
  color: string;
  thickness?: number;
  /** Une el último punto con el primero (radar, grilla poligonal). */
  closed?: boolean;
  opacity?: number;
  testID?: string;
}

/**
 * Una línea es un rectángulo fino rotado sobre su centro, uno por tramo. Con
 * `smoothPoints` los tramos son tantos que la poligonal se lee como curva.
 *
 * Los extremos quedan a tope, no redondeados: un `borderRadius` por tramo
 * multiplicaría las vistas y a 2px de grosor nadie ve la diferencia.
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
  /** Aro del color del fondo: despega el punto de la línea que lo cruza. */
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

// ── porción ────────────────────────────────────────────────────────────────

interface HalfProps {
  size: number;
  /** Apertura de esta mitad, 0–180. */
  sweep: number;
  color: string;
}

/**
 * Sector de hasta 180°, sin curvas ni máscaras. Tres cajas:
 *
 * 1. un recorte fijo a la mitad derecha (`overflow: 'hidden'`), que es el
 *    sector 0°–180°;
 * 2. adentro, un cuadrado `size` × `size` centrado en el centro del círculo,
 *    que es lo que gira — al rotar sobre su propio centro, rota sobre el
 *    centro del círculo sin necesidad de `transformOrigin`;
 * 3. adentro del cuadrado, **medio disco**, no un disco entero: un rectángulo
 *    de media caja con las dos esquinas de afuera redondeadas al radio.
 *
 * El medio disco es lo que hace que la rotación signifique algo. Con un disco
 * completo el recorte deja siempre la misma media luna —rotar un círculo
 * sólido no lo cambia—, y toda porción, sea de 5° o de 180°, sale igual de
 * ancha: 180°.
 *
 * Girado `sweep - 180`, el medio disco cubre de `sweep - 180` a `sweep`, y lo
 * que sobrevive al recorte es exactamente 0°–`sweep`.
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
  /** Diámetro: la porción se dibuja centrada en una caja `size` × `size`. */
  size: number;
  /** Ángulo donde empieza, 0° arriba y creciendo en horario. */
  start: number;
  /** Apertura, 0–360. */
  sweep: number;
  color: string;
  opacity?: number;
  /** Desplaza la porción hacia afuera por su bisectriz (la seleccionada). */
  explode?: number;
  /** Centro dentro del contenedor. Sin él la porción se apoya en (0, 0). */
  center?: Point;
  testID?: string;
}

const FULL_CIRCLE = 359.9;

export const Wedge = memo(({ size, start, sweep, color, opacity = 1, explode = 0, center, testID }: WedgeProps) => {
  if (sweep <= 0 || size <= 0) return null;
  // 360° exactos dejan las dos mitades a 180°, y la de arriba tapa a la de
  // abajo por una rendija de antialias. Un pelo menos no se ve y no pasa.
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
