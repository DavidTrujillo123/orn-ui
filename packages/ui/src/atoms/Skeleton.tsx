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

export type SkeletonVariant = 'rect' | 'text' | 'circle';

export interface SkeletonProps {
  /** @default '100%' ('circle' lo usa también como diámetro) */
  width?: DimensionValue;
  /** @default 16 ('text' usa el alto de línea; 'circle', el ancho) */
  height?: DimensionValue;
  /** @default 'rect' */
  variant?: SkeletonVariant;
  /** Override del radius del theme. */
  radius?: number;
  /** Líneas apiladas, sólo para variant="text". @default 1 */
  lines?: number;
  /** Ancho de la última línea, para que el párrafo no termine en bloque. @default '60%' */
  lastLineWidth?: DimensionValue;
  /** @default true */
  animated?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const useStyles = createStyles((theme) => ({
  block: { backgroundColor: theme.colors.skeleton },
  lines: { gap: theme.tokens.spacing.sm },
}));

/**
 * Skeleton
 * Placeholder que late mientras llega el contenido real. Reserva el espacio
 * exacto de lo que reemplaza, así la pantalla no salta cuando aparecen los
 * datos — que es justamente lo que un Spinner centrado no puede hacer.
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
    const pulse = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      if (!animated) return;
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, {
            toValue: 1,
            duration: 700,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.quad),
          }),
          Animated.timing(pulse, {
            toValue: 0,
            duration: 700,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.quad),
          }),
        ])
      );
      loop.start();
      return () => loop.stop();
    }, [animated, pulse]);

    const isCircle = variant === 'circle';
    const isText = variant === 'text';
    const opacity = animated ? pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 0.4] }) : 1;
    const resolvedHeight = isCircle ? width : isText ? theme.tokens.fontSize.md : height;
    const resolvedRadius =
      radius ?? (isCircle ? theme.tokens.radius.full : isText ? theme.tokens.radius.xs : theme.tokens.radius.sm);

    const barStyle = (barWidth: DimensionValue): StyleProp<ViewStyle> => [
      styles.block,
      { width: barWidth, height: resolvedHeight, borderRadius: resolvedRadius, opacity },
    ];

    const a11y = { accessibilityElementsHidden: true, importantForAccessibility: 'no-hide-descendants' as const };

    if (isText && lines > 1) {
      return (
        <View style={[styles.lines, style]} testID={testID} {...a11y}>
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
