import React, { memo, useMemo } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

export type GradientDirection = 'vertical' | 'horizontal' | 'diagonal' | 'diagonal-reverse';

export interface GradientProps {
  /** Paradas del degradado. Uno solo pinta plano; ninguno no pinta nada. */
  colors: string[];
  /**
   * 'vertical' va de arriba a abajo, 'horizontal' de izquierda a derecha,
   * 'diagonal' de arriba-izquierda a abajo-derecha y 'diagonal-reverse' de
   * arriba-derecha a abajo-izquierda.
   * @default 'vertical'
   */
  direction?: GradientDirection;
  /**
   * Bandas por tramo (un tramo = un par de colores consecutivos). Más bandas
   * = transición más suave y más vistas en el árbol.
   * @default 24
   */
  steps?: number;
  /** Contenido por encima del degradado. */
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const DEFAULT_STEPS = 24;

const styles = StyleSheet.create({
  // Recorta el plano rotado de las diagonales y el degradado al borderRadius.
  root: { overflow: 'hidden' },
  segment: { flex: 1 },
  band: { flex: 1 },
  // Plano √2 centrado: rotado 45° cubre las esquinas sin medir el contenedor.
  diagonalPlane: { position: 'absolute', top: '-21%', left: '-21%', width: '142%', height: '142%' },
});

/**
 * Gradient
 * Degradado lineal sin dependencias: React Native no trae uno en el rango
 * soportado (Expo SDK 54–57) y `experimental_backgroundImage` no está en toda
 * esa ventana, así que se compone con bandas.
 *
 * Cada tramo pinta el color inicial y encima N bandas del final con opacidad
 * de 0 a 1. El compositor mezcla alpha linealmente: el resultado es la
 * interpolación sRGB entre paradas sin parsear el color, y por eso vale
 * cualquier formato que acepte RN (hex, `rgba()`, nombre).
 */
export const Gradient = memo(
  ({ colors, direction = 'vertical', steps = DEFAULT_STEPS, children, style, testID }: GradientProps) => {
    const isRow = direction === 'horizontal';
    const isDiagonal = direction === 'diagonal' || direction === 'diagonal-reverse';
    // rotate positivo gira en horario (Y crece hacia abajo): -45° manda el eje
    // del degradado hacia abajo-derecha.
    const rotate = direction === 'diagonal' ? '-45deg' : '45deg';
    const bandCount = Math.max(2, Math.floor(steps));

    const painted = useMemo(() => {
      if (colors.length === 0) return null;
      if (colors.length === 1) {
        return <View style={[StyleSheet.absoluteFill, { backgroundColor: colors[0] }]} />;
      }

      const segments = colors.slice(0, -1).map((from, index) => {
        const to = colors[index + 1] as string;
        return (
          <View
            key={`${from}-${to}-${index}`}
            style={[styles.segment, { backgroundColor: from, flexDirection: isRow ? 'row' : 'column' }]}
          >
            {Array.from({ length: bandCount }, (_, band) => (
              <View key={band} style={[styles.band, { backgroundColor: to, opacity: band / (bandCount - 1) }]} />
            ))}
          </View>
        );
      });

      const stack = (
        <View style={[StyleSheet.absoluteFill, { flexDirection: isRow ? 'row' : 'column' }]}>{segments}</View>
      );

      if (!isDiagonal) return stack;
      return <View style={[styles.diagonalPlane, { transform: [{ rotate }] }]}>{segments}</View>;
    }, [colors, isRow, isDiagonal, rotate, bandCount]);

    return (
      <View testID={testID} style={[styles.root, style]}>
        {/* pointerEvents va en el pintado, no en la raíz: el degradado no debe
            robarle los toques a lo que el consumidor ponga encima. */}
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          {painted}
        </View>
        {children}
      </View>
    );
  }
);
Gradient.displayName = 'Gradient';
