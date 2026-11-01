import React, { memo, useMemo, useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native';

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
  // Plano √2 centrado: cubre las esquinas de un contenedor CUADRADO sin
  // medirlo. Solo se usa hasta el primer onLayout; después el plano se
  // dimensiona con la diagonal real (ver `diagonalBox`).
  diagonalPlane: { position: 'absolute', top: '-21%', left: '-21%', width: '142%', height: '142%' },
});

/**
 * Opacidades de capas acumuladas: la capa k (de 1 a n-1) arranca en k/n y
 * llega hasta el final del tramo; apiladas con "over", la opacidad total en
 * la banda k es k/(n-1), igual que bandas lado a lado. La diferencia: ningún
 * borde de capa queda junto a un hueco, así el antialiasing de un borde
 * (sobre todo rotado) mezcla con el color de la capa de abajo y no con lo que
 * hay detrás del degradado — sin las líneas finas entre bandas.
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

/** Cuadrado del lado de la diagonal, centrado: rotado 45° cubre cualquier rectángulo. */
function diagonalBox(width: number, height: number): ViewStyle {
  const side = Math.hypot(width, height);
  return { position: 'absolute', width: side, height: side, left: (width - side) / 2, top: (height - side) / 2 };
}

/**
 * Gradient
 * Degradado lineal sin dependencias: React Native no trae uno en el rango
 * soportado (Expo SDK 54–57) y `experimental_backgroundImage` no está en toda
 * esa ventana, así que se compone con bandas.
 *
 * Cada tramo pinta el color inicial y encima capas del final que se
 * acumulan (ver `layerOpacities`). El compositor mezcla alpha linealmente: el
 * resultado es la interpolación sRGB entre paradas sin parsear el color, y
 * por eso vale cualquier formato que acepte RN (hex, `rgba()`, nombre). Las
 * capas llegan hasta el final del plano para que no queden líneas finas entre
 * bandas, y las diagonales giran un cuadrado del tamaño de la diagonal medida
 * para cubrir cualquier rectángulo, no solo los cuadrados.
 *
 * Gestalt, figura y fondo: el contenido encima debe contrastar con TODAS las
 * paradas, no solo con la primera — un texto blanco que se lee sobre el azul
 * del inicio puede perderse sobre el celeste del final.
 */
export const Gradient = memo(
  ({ colors, direction = 'vertical', steps = DEFAULT_STEPS, children, style, testID }: GradientProps) => {
    const isRow = direction === 'horizontal';
    const isDiagonal = direction === 'diagonal' || direction === 'diagonal-reverse';
    // rotate positivo gira en horario (Y crece hacia abajo): -45° manda el eje
    // del degradado hacia abajo-derecha.
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
      // Desde `start` (fracción del eje) hasta el final del plano.
      const from = (start: number): ViewStyle =>
        isRow
          ? { position: 'absolute', top: 0, bottom: 0, right: 0, left: `${start * 100}%` }
          : { position: 'absolute', left: 0, right: 0, bottom: 0, top: `${start * 100}%` };

      // Tramos acumulados también: cada uno tapa al anterior desde su inicio,
      // y como empieza con el color en que terminó el anterior, el borde entre
      // tramos no deja ver el fondo.
      const segments = colors.slice(0, -1).map((start, index) => {
        const to = colors[index + 1] as string;
        const segStart = index / segmentCount;
        const segLength = 1 / segmentCount;
        // El tramo va de segStart hasta el FINAL del plano; sus capas se
        // ubican en fracciones de ese largo restante.
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
