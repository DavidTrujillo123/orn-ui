import React, { memo, useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  View,
  type DimensionValue,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { createStyles } from '../theme/createStyles';
import { useTheme } from '../theme/UIProvider';
import { useReduceMotion } from './Transition';

/** Medio ciclo del latido (opaco → tenue). Un loop de carga, no una transición: no sale de `duration`. */
const PULSE_HALF_MS = 700;

export type SkeletonVariant = 'rect' | 'text' | 'circle';

export interface SkeletonProps {
  /** @default '100%' ('circle' also uses this as the diameter) */
  width?: DimensionValue;
  /** @default 16 ('text' uses Body's line height; 'circle', the width) */
  height?: DimensionValue;
  /** @default 'rect' */
  variant?: SkeletonVariant;
  /** Override of the theme's radius. */
  radius?: number;
  /** Stacked lines, only for variant="text". @default 1 */
  lines?: number;
  /** Width of the last line, so the paragraph doesn't end as a solid block. @default '60%' */
  lastLineWidth?: DimensionValue;
  /** Pulses while waiting. Off when the system's Reduce Motion is on. @default true */
  animated?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const useStyles = createStyles((theme) => ({
  block: { backgroundColor: theme.colors.skeleton },
  // Cada renglón ocupa exactamente `lineHeight.md` (el de Body): barra de
  // `fontSize.md` más la mitad del interlineado arriba y abajo. Así el párrafo
  // falso mide lo mismo que el real y no hay salto al llegar el contenido.
  textLine: {
    marginVertical: (theme.tokens.lineHeight.md - theme.tokens.fontSize.md) / 2,
  },
}));

/**
 * Skeleton
 * Placeholder que late mientras llega el contenido real. Reserva el espacio
 * exacto de lo que reemplaza, así la pantalla no salta cuando aparecen los
 * datos — que es justamente lo que un Spinner centrado no puede hacer.
 *
 * Gestalt, similitud: la silueta repite forma y tamaño del contenido (círculo
 * para avatares, renglones del alto de Body para texto), así el ojo ya agrupa
 * la pantalla antes de que lleguen los datos. Respeta Reduce Motion: sin
 * latido, bloque fijo.
 */
export const Skeleton = memo(
  ({
    width = '100%',
    height = 16,
    variant = 'rect',
    radius,
    lines = 1,
    lastLineWidth = '60%',
    animated = true,
    style,
    testID,
  }: SkeletonProps) => {
    const theme = useTheme();
    const styles = useStyles();
    const reduceMotion = useReduceMotion();
    const pulsing = animated && !reduceMotion;
    const pulse = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      if (!pulsing) return;
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, {
            toValue: 1,
            duration: PULSE_HALF_MS,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.quad),
          }),
          Animated.timing(pulse, {
            toValue: 0,
            duration: PULSE_HALF_MS,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.quad),
          }),
        ])
      );
      loop.start();
      return () => {
        loop.stop();
        pulse.setValue(0);
      };
    }, [pulsing, pulse]);

    const isCircle = variant === 'circle';
    const isText = variant === 'text';
    const opacity = pulsing ? pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 0.4] }) : 1;
    const resolvedHeight = isCircle ? width : isText ? theme.tokens.fontSize.md : height;
    const resolvedRadius =
      radius ?? (isCircle ? theme.tokens.radius.full : isText ? theme.tokens.radius.xs : theme.tokens.radius.sm);

    const barStyle = (barWidth: DimensionValue): StyleProp<ViewStyle> => [
      styles.block,
      isText && styles.textLine,
      { width: barWidth, height: resolvedHeight, borderRadius: resolvedRadius, opacity },
    ];

    const a11y = { accessibilityElementsHidden: true, importantForAccessibility: 'no-hide-descendants' as const };

    if (isText && lines > 1) {
      return (
        <View style={style} testID={testID} {...a11y}>
          {Array.from({ length: lines }, (_, i) => (
            <Animated.View
              key={i}
              testID={testID && `${testID}-${i}`}
              style={barStyle(i === lines - 1 ? lastLineWidth : width)}
            />
          ))}
        </View>
      );
    }

    return <Animated.View style={[barStyle(width), style]} testID={testID} {...a11y} />;
  }
);
Skeleton.displayName = 'Skeleton';
