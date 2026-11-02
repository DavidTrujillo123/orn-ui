import React, { createContext, useContext, useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  Easing,
  Keyboard,
  Platform,
  StyleSheet,
  type KeyboardEvent,
} from 'react-native';
import { useReduceMotion } from './useReduceMotion';

/** Un campo enfocado que el host tiene que mantener a la vista. */
export interface KeyboardField {
  /** Caja del campo en coordenadas de ventana (label, campo y error incluidos). */
  measure: () => Promise<{ y: number; height: number } | null>;
}

export interface KeyboardHost {
  focus: (field: KeyboardField) => void;
  blur: (field: KeyboardField) => void;
}

const KeyboardHostContext = createContext<KeyboardHost | null>(null);

/** El host activo, o null si un contenedor ya resuelve el teclado (o está apagado). */
export function useKeyboardHost(): KeyboardHost | null {
  return useContext(KeyboardHostContext);
}

/**
 * Para contenedores que ya mantienen visible el campo enfocado por su cuenta:
 * un Modal o BottomSheet (ventana nativa propia, que el desplazamiento de la
 * raíz no mueve) o un ScrollView con `automaticallyAdjustKeyboardInsets`.
 * Adentro, los Input no le piden nada al host y el teclado no se compensa dos
 * veces.
 */
export function KeyboardHandled({ children }: { children: React.ReactNode }) {
  return <KeyboardHostContext.Provider value={null}>{children}</KeyboardHostContext.Provider>;
}

/** Duración cuando el evento del teclado no la trae (Android). */
const FALLBACK_DURATION = 250;

/**
 * Desplazamiento vertical (≤ 0) para que el campo quede entero por encima del
 * teclado, con `margin` de aire, sin que su borde superior pase de `topLimit`.
 * `fieldY` es la posición medida con el desplazamiento `current` aplicado.
 * Si el campo ya se ve, vuelve hacia 0: nunca sube más de lo necesario.
 */
export function computeKeyboardOffset({
  fieldY,
  fieldHeight,
  keyboardTop,
  current,
  margin,
  topLimit,
}: {
  fieldY: number;
  fieldHeight: number;
  keyboardTop: number;
  current: number;
  margin: number;
  topLimit: number;
}): number {
  const base = fieldY - current;
  let target = Math.min(0, keyboardTop - margin - (base + fieldHeight));
  // Un campo más alto que el hueco disponible: prima ver dónde se escribe
  // (su parte de arriba) antes que su error.
  target = Math.max(target, topLimit - base);
  return Math.min(0, target);
}

/**
 * Montado una sola vez por el UIProvider raíz. Escucha el teclado y, si tapa
 * al Input enfocado, desplaza toda la app hacia arriba lo justo (transform en
 * el hilo nativo); al cerrarse el teclado vuelve a 0. Es el `adjustPan` de
 * Android, igual en las dos plataformas y sin depender de Screen ni de un
 * ScrollView: lo que se escribe siempre se ve.
 */
export function KeyboardAvoidingRoot({
  margin,
  topLimit,
  children,
}: {
  margin: number;
  topLimit: number;
  children: React.ReactNode;
}) {
  const pan = useRef(new Animated.Value(0)).current;
  const offset = useRef(0);
  const field = useRef<KeyboardField | null>(null);
  const keyboardTop = useRef<number | null>(null);
  const reduceMotion = useReduceMotion();
  const config = useRef({ margin, topLimit, reduceMotion });
  config.current = { margin, topLimit, reduceMotion };

  const host = useMemo<KeyboardHost>(() => {
    const animateTo = (to: number, duration: number) => {
      if (to === offset.current) return;
      offset.current = to;
      Animated.timing(pan, {
        toValue: to,
        duration: config.current.reduceMotion ? 0 : duration,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    };

    const adjust = async (duration: number) => {
      const current = field.current;
      const top = keyboardTop.current;
      if (!current || top === null) return;
      const box = await current.measure();
      // Mientras se medía, el foco pudo pasar a otro campo o el teclado cerrarse.
      if (!box || field.current !== current || keyboardTop.current === null) return;
      animateTo(
        computeKeyboardOffset({
          fieldY: box.y,
          fieldHeight: box.height,
          keyboardTop: keyboardTop.current,
          current: offset.current,
          margin: config.current.margin,
          topLimit: config.current.topLimit,
        }),
        duration
      );
    };

    return {
      focus(next) {
        field.current = next;
        // Con el teclado ya abierto (pasar de un campo a otro) se reajusta ya.
        if (keyboardTop.current !== null) void adjust(FALLBACK_DURATION);
      },
      blur(prev) {
        if (field.current === prev) field.current = null;
      },
      // Uso interno de los listeners de abajo.
      _show(e: KeyboardEvent | undefined) {
        if (!e?.endCoordinates) return;
        keyboardTop.current = e.endCoordinates.screenY;
        const duration = e.duration || FALLBACK_DURATION;
        // Android emite didShow después de redimensionar la ventana: se mide en
        // el frame siguiente, con el layout ya asentado.
        if (Platform.OS === 'android') requestAnimationFrame(() => void adjust(duration));
        else void adjust(duration);
      },
      _hide(e: KeyboardEvent | undefined) {
        keyboardTop.current = null;
        animateTo(0, e?.duration || FALLBACK_DURATION);
      },
    } as KeyboardHost & { _show: (e: KeyboardEvent) => void; _hide: (e?: KeyboardEvent) => void };
  }, [pan]);

  useEffect(() => {
    const h = host as KeyboardHost & { _show: (e: KeyboardEvent) => void; _hide: (e?: KeyboardEvent) => void };
    // iOS avisa antes de animar (will*): el desplazamiento acompaña al teclado.
    // Android solo tiene did*.
    const subs =
      Platform.OS === 'ios'
        ? [
            Keyboard.addListener('keyboardWillShow', h._show),
            Keyboard.addListener('keyboardWillChangeFrame', h._show),
            Keyboard.addListener('keyboardWillHide', h._hide),
          ]
        : [Keyboard.addListener('keyboardDidShow', h._show), Keyboard.addListener('keyboardDidHide', h._hide)];
    return () => subs.forEach((s) => s.remove());
  }, [host]);

  return (
    <KeyboardHostContext.Provider value={host}>
      <Animated.View style={[styles.root, { transform: [{ translateY: pan }] }]}>{children}</Animated.View>
    </KeyboardHostContext.Provider>
  );
}

const styles = StyleSheet.create({ root: { flex: 1 } });
