import React, { memo, useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '../theme/UIProvider';

export type TransitionPreset =
  | 'fade'
  | 'scale'
  | 'pop'
  | 'slide-up'
  | 'slide-down'
  | 'slide-left'
  | 'slide-right';

export interface TransitionProps {
  children: React.ReactNode;
  /** Entra en true, sale (y desmonta) en false. @default true */
  visible?: boolean;
  /** Uno o varios: 'fade scale' combina opacidad y escala. @default 'fade' */
  preset?: TransitionPreset | TransitionPreset[];
  /** ms del timing. @default tokens.duration.base */
  duration?: number;
  /** ms antes de arrancar. Un índice por delay escalona una lista. @default 0 */
  delay?: number;
  /** Píxeles que recorren los presets de slide. @default 24 */
  distance?: number;
  /** Spring en vez de timing (implícito en 'pop'). */
  spring?: boolean;
  /** Anima también el primer render. En false arranca ya presente. @default true */
  appear?: boolean;
  /** Deja el nodo montado al salir, sólo lo esconde. @default false */
  keepMounted?: boolean;
  /**
   * Progreso 0→1 manejado desde afuera. Con esto el Transition sólo interpola:
   * quien lo pasa decide cuándo y cómo avanza (un PanResponder, por ejemplo).
   */
  value?: Animated.Value;
  onEntered?: () => void;
  onExited?: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const SCALE_FROM: Record<'scale' | 'pop', number> = { scale: 0.92, pop: 0.8 };

/**
 * Sigue el ajuste de "reducir movimiento" del sistema: con él activo las
 * animaciones saltan al estado final en vez de desactivarse, así que los
 * callbacks y el desmontaje siguen ocurriendo igual.
 */
export function useReduceMotion(): boolean {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let alive = true;
    // Sólo se actualiza el estado si el ajuste está activo: el valor inicial ya
    // es `false` y un setState de false a false costaría un render por montaje.
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (alive && enabled) setReduceMotion(true);
    });
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => {
      alive = false;
      sub.remove();
    };
  }, []);

  return reduceMotion;
}

/**
 * Transition
 * Envuelve cualquier árbol y lo anima al entrar y al salir. Todos los presets
 * se reducen a `opacity` y `transform` sobre un único Animated.Value, que es
 * lo que `useNativeDriver` sabe mandar al hilo nativo: la animación corre ahí
 * y el hilo de JS no participa de ningún frame — por eso no hay presets de
 * alto, ancho o color, que obligarían a volver a JS en cada frame.
 *
 * El nodo se mantiene montado hasta que termina la animación de salida, y el
 * comportamiento es idéntico en iOS y Android: no hay ninguna rama por
 * plataforma.
 */
export const Transition = memo(
  ({
    children,
    visible = true,
    preset = 'fade',
    duration,
    delay = 0,
    distance = 24,
    spring,
    appear = true,
    keepMounted = false,
    value,
    onEntered,
    onExited,
    style,
    testID,
  }: TransitionProps) => {
    const theme = useTheme();
    const reduceMotion = useReduceMotion();
    const internal = useRef(new Animated.Value(visible && !appear ? 1 : 0)).current;
    const progress = value ?? internal;
    const driven = value === undefined;

    const [mounted, setMounted] = useState(visible || keepMounted);

    // Los callbacks viven en un ref: pasados inline cambian de identidad en
    // cada render y, como dependencias del efecto, reiniciarían la animación.
    const callbacks = useRef({ onEntered, onExited });
    useEffect(() => {
      callbacks.current = { onEntered, onExited };
    });

    const presetKey = Array.isArray(preset) ? preset.join(' ') : preset;
    const presets = useMemo(() => presetKey.split(' ') as TransitionPreset[], [presetKey]);

    useEffect(() => {
      if (visible) setMounted(true);
    }, [visible]);

    useEffect(() => {
      if (!driven) return;
      const toValue = visible ? 1 : 0;
      const useSpring = spring ?? presets.includes('pop');

      const animation = reduceMotion
        ? Animated.timing(progress, { toValue, duration: 0, delay, useNativeDriver: true })
        : useSpring
          ? Animated.spring(progress, { toValue, delay, friction: 9, tension: 90, useNativeDriver: true })
          : Animated.timing(progress, {
              toValue,
              delay,
              duration: duration ?? theme.tokens.duration.base,
              easing: visible ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic),
              useNativeDriver: true,
            });

      animation.start(({ finished }) => {
        if (!finished) return;
        if (visible) {
          callbacks.current.onEntered?.();
          return;
        }
        callbacks.current.onExited?.();
        if (!keepMounted) setMounted(false);
      });

      return () => animation.stop();
    }, [visible, driven, reduceMotion, spring, delay, duration, keepMounted, presets, progress, theme]);

    const animatedStyle = useMemo(() => {
      type Interpolated = Animated.AnimatedInterpolation<number>;
      const transform: Array<{ scale: Interpolated } | { translateX: Interpolated } | { translateY: Interpolated }> = [];
      let opacity: Animated.Value | undefined;

      for (const item of presets) {
        if (item === 'fade') {
          opacity = progress;
          continue;
        }
        if (item === 'scale' || item === 'pop') {
          transform.push({
            scale: progress.interpolate({ inputRange: [0, 1], outputRange: [SCALE_FROM[item], 1] }),
          });
          continue;
        }
        const vertical = item === 'slide-up' || item === 'slide-down';
        const from = item === 'slide-up' || item === 'slide-left' ? distance : -distance;
        const offset = progress.interpolate({ inputRange: [0, 1], outputRange: [from, 0] });
        transform.push(vertical ? { translateY: offset } : { translateX: offset });
      }

      return { opacity, transform };
    }, [presets, progress, distance]);

    if (!mounted) return null;

    return (
      <Animated.View
        testID={testID}
        pointerEvents={visible ? undefined : 'none'}
        style={[style, animatedStyle]}
      >
        {children}
      </Animated.View>
    );
  }
);
Transition.displayName = 'Transition';
