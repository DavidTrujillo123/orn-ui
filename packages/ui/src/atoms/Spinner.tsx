import React, { memo, useEffect, useRef } from 'react';
import { ActivityIndicator, Animated, Easing, Text, View } from 'react-native';
import { createStyles } from '../theme/createStyles';
import { useAllowFontScaling, useColors, useLabels } from '../theme/UIProvider';

export type SpinnerVariant = 'native' | 'dots' | 'ring';

export interface SpinnerProps {
  size?: 'small' | 'large';
  color?: string;
  text?: string;
  /** @default true. When false, doesn't take up flex:1 (useful inline, inside a button/row). */
  fullscreen?: boolean;
  /**
   * 'native' uses the system's ActivityIndicator; 'dots' and 'ring' are
   * custom indicators, identical on iOS and Android.
   * @default 'native'
   */
  variant?: SpinnerVariant;
  /** Fully custom indicator. Takes precedence over `variant`. */
  indicator?: React.ReactNode;
  /**
   * Shown above the indicator — typically the app logo on a splash or
   * first-load screen (an `<Image>`, an `<Avatar>`, any node).
   */
  logo?: React.ReactNode;
  /** What screen readers announce. @default text ?? labels.loading */
  accessibilityLabel?: string;
  testID?: string;
}

// Ritmo de los indicadores en loop. No son transiciones de UI (esas usan
// theme.tokens.duration): son el pulso de una animación continua.
const DOT_PULSE_MS = 320;
const DOT_STAGGER_MS = 140;
const RING_TURN_MS = 900;

const useStyles = createStyles((theme) => ({
  container: { justifyContent: 'center', alignItems: 'center', padding: theme.tokens.spacing.xl },
  text: { marginTop: theme.tokens.spacing.md, color: theme.colors.textLight, fontSize: theme.tokens.fontSize.md },
  logo: { marginBottom: theme.tokens.spacing.xl },
  dots: { flexDirection: 'row', gap: theme.tokens.spacing.sm },
}));

/** Tres puntos que laten en secuencia. Animated + useNativeDriver: corre en el hilo nativo. */
const DotsIndicator = memo(({ color, dotSize }: { color: string; dotSize: number }) => {
  const dots = [useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current];

  useEffect(() => {
    const animations = dots.map((dot, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * DOT_STAGGER_MS),
          Animated.timing(dot, { toValue: 1, duration: DOT_PULSE_MS, useNativeDriver: true, easing: Easing.out(Easing.quad) }),
          Animated.timing(dot, { toValue: 0, duration: DOT_PULSE_MS, useNativeDriver: true, easing: Easing.in(Easing.quad) }),
          Animated.delay((2 - i) * DOT_STAGGER_MS),
        ])
      )
    );
    animations.forEach((a) => a.start());
    // Sin stop() los loops siguen corriendo tras desmontar y mantienen vivo
    // el árbol de Animated.
    return () => animations.forEach((a) => a.stop());
  }, []);

  return (
    <View style={{ flexDirection: 'row', gap: dotSize * 0.6 }}>
      {dots.map((dot, i) => (
        <Animated.View
          key={i}
          style={{
            width: dotSize,
            height: dotSize,
            borderRadius: dotSize / 2,
            backgroundColor: color,
            opacity: dot.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }),
            transform: [{ scale: dot.interpolate({ inputRange: [0, 1], outputRange: [0.75, 1] }) }],
          }}
        />
      ))}
    </View>
  );
});
DotsIndicator.displayName = 'DotsIndicator';

/**
 * Anillo que gira: un riel tenue fijo y encima un arco (un solo lado del
 * borde) que gira. El riel usa `opacity` en vez de concatenar alpha al color
 * (`color + '33'`), que solo funcionaba con hex de 6 dígitos y rompía con
 * `rgb()` o nombres de color.
 */
const RingIndicator = memo(({ color, diameter }: { color: string; diameter: number }) => {
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(spin, { toValue: 1, duration: RING_TURN_MS, useNativeDriver: true, easing: Easing.linear })
    );
    animation.start();
    return () => animation.stop();
  }, []);

  const ring = { width: diameter, height: diameter, borderRadius: diameter / 2, borderWidth: Math.max(2, diameter / 10) };
  return (
    <View style={{ width: diameter, height: diameter }}>
      <View style={[ring, { position: 'absolute', borderColor: color, opacity: 0.2 }]} />
      <Animated.View
        style={[
          ring,
          {
            borderColor: 'transparent',
            borderTopColor: color,
            transform: [{ rotate: spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }],
          },
        ]}
      />
    </View>
  );
});
RingIndicator.displayName = 'RingIndicator';

/**
 * Spinner
 * Indicador de carga indeterminada, con texto opcional debajo.
 *
 * Gestalt:
 * - Destino común: los tres puntos de `dots` laten en secuencia, con el
 *   mismo ritmo, y se leen como un solo indicador que avanza.
 * - Proximidad: el texto va a `spacing.md` del indicador, así se lee como su
 *   explicación y no como texto suelto de la pantalla. El `logo` va más lejos
 *   (`spacing.xl`): es la marca de la pantalla, no parte del indicador.
 * - Punto focal: con `logo`, el logo es lo primero que se ve y el indicador
 *   queda como señal secundaria de que la app está cargando.
 *
 * Accesibilidad: se anuncia como `progressbar` ocupado, con `text` (o
 * `labels.loading`) como nombre. La animación no se detiene con Reduce
 * Motion: es la señal de que algo está pasando, como el ActivityIndicator del
 * sistema.
 */
export const Spinner = memo(
  ({
    size = 'large',
    color,
    text,
    fullscreen = true,
    variant = 'native',
    indicator,
    logo,
    accessibilityLabel,
    testID,
  }: SpinnerProps) => {
    const colors = useColors();
    const labels = useLabels();
    const styles = useStyles();
    const allowFontScaling = useAllowFontScaling();
    const resolvedColor = color || colors.primary;
    const scale = size === 'small' ? 8 : 12;

    const renderIndicator = () => {
      if (indicator) return indicator;
      if (variant === 'dots') return <DotsIndicator color={resolvedColor} dotSize={scale} />;
      if (variant === 'ring') return <RingIndicator color={resolvedColor} diameter={scale * 3} />;
      return <ActivityIndicator size={size} color={resolvedColor} />;
    };

    return (
      <View
        style={[styles.container, fullscreen && { flex: 1 }]}
        testID={testID}
        accessible
        accessibilityRole="progressbar"
        accessibilityLabel={accessibilityLabel ?? (text || labels.loading)}
        accessibilityState={{ busy: true }}
        accessibilityLiveRegion="polite"
      >
        {logo != null && <View style={styles.logo}>{logo}</View>}
        {renderIndicator()}
        {!!text && (
          <Text allowFontScaling={allowFontScaling} style={styles.text}>
            {text}
          </Text>
        )}
      </View>
    );
  }
);
Spinner.displayName = 'Spinner';
