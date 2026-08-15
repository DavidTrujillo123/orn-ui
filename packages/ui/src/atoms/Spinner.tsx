import React, { memo, useEffect, useRef } from 'react';
import { ActivityIndicator, Animated, Easing, Text, View } from 'react-native';
import { createStyles } from '../theme/createStyles';
import { useAllowFontScaling, useColors } from '../theme/UIProvider';

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
  testID?: string;
}

const useStyles = createStyles((theme) => ({
  container: { justifyContent: 'center', alignItems: 'center', padding: theme.tokens.spacing.xl },
  text: { marginTop: theme.tokens.spacing.md, color: theme.colors.textLight, fontSize: theme.tokens.fontSize.md },
  dots: { flexDirection: 'row', gap: theme.tokens.spacing.sm },
}));

/** Tres puntos que laten en secuencia. Animated + useNativeDriver: corre en el hilo nativo. */
const DotsIndicator = memo(({ color, dotSize }: { color: string; dotSize: number }) => {
  const dots = [useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current];

  useEffect(() => {
    const animations = dots.map((dot, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 140),
          Animated.timing(dot, { toValue: 1, duration: 320, useNativeDriver: true, easing: Easing.out(Easing.quad) }),
          Animated.timing(dot, { toValue: 0, duration: 320, useNativeDriver: true, easing: Easing.in(Easing.quad) }),
          Animated.delay((2 - i) * 140),
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

/** Anillo que gira: un borde con un solo lado coloreado. */
const RingIndicator = memo(({ color, diameter }: { color: string; diameter: number }) => {
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(spin, { toValue: 1, duration: 900, useNativeDriver: true, easing: Easing.linear })
    );
    animation.start();
    return () => animation.stop();
  }, []);

  return (
    <Animated.View
      style={{
        width: diameter,
        height: diameter,
        borderRadius: diameter / 2,
        borderWidth: Math.max(2, diameter / 10),
        borderColor: color + '33',
        borderTopColor: color,
        transform: [{ rotate: spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }],
      }}
    />
  );
});
RingIndicator.displayName = 'RingIndicator';

export const Spinner = memo(
  ({ size = 'large', color, text, fullscreen = true, variant = 'native', indicator, testID }: SpinnerProps) => {
    const colors = useColors();
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
      <View style={[styles.container, fullscreen && { flex: 1 }]} testID={testID}>
        {renderIndicator()}
        {text && (
          <Text allowFontScaling={allowFontScaling} style={styles.text}>
            {text}
          </Text>
        )}
      </View>
    );
  }
);
Spinner.displayName = 'Spinner';
