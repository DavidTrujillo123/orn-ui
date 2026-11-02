import React, { createContext, useContext, useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  Easing,
  Keyboard,
  Platform,
  StyleSheet,
  View,
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
 * Un área que se desplaza para que el Input enfocado de adentro quede sobre
 * el teclado (transform en el hilo nativo; al cerrarse vuelve a 0). Es el
 * `adjustPan` de Android, igual en las dos plataformas.
 *
 * - El UIProvider raíz monta una alrededor de toda la app: el respaldo, para
 *   que un Input se vea aunque no esté dentro de un Screen.
 * - Screen monta otra alrededor de su contenido, con `clip`: se mueve solo el
 *   contenido y el header (prop `header`) y la barra de pestañas quedan
 *   quietos, como en una app nativa. El Input se registra con el área más
 *   cercana, así que adentro de un Screen la raíz no se mueve.
 *
 * Con `clip`, lo que sube se recorta en el borde superior del área y el campo
 * nunca pasa por encima de ese borde (queda bajo el header).
 */
export function KeyboardPanArea({
  margin,
  topLimit,
  clip = false,
  children,
}: {
  margin: number;
  /** Límite superior en coordenadas de ventana. Con `clip`, se toma el borde del área si es más bajo. */
  topLimit: number;
  clip?: boolean;
  children: React.ReactNode;
}) {
  const areaRef = useRef<View>(null);
  const pan = useRef(new Animated.Value(0)).current;
  const offset = useRef(0);
  const field = useRef<KeyboardField | null>(null);
  const keyboardTop = useRef<number | null>(null);
  const reduceMotion = useReduceMotion();
  const config = useRef({ margin, topLimit, reduceMotion, clip });
  config.current = { margin, topLimit, reduceMotion, clip };

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
      let limit = config.current.topLimit;
      if (config.current.clip) {
        const areaTop = await measureTop(areaRef.current);
        if (areaTop !== null) limit = Math.max(limit, areaTop);
      }
      animateTo(
        computeKeyboardOffset({
          fieldY: box.y,
          fieldHeight: box.height,
          keyboardTop: keyboardTop.current,
          current: offset.current,
          margin: config.current.margin,
          topLimit: limit,
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

  const moving = <Animated.View style={[styles.fill, { transform: [{ translateY: pan }] }]}>{children}</Animated.View>;
  return (
    <KeyboardHostContext.Provider value={host}>
      {clip ? (
        <View ref={areaRef} style={[styles.fill, styles.clip]} collapsable={false}>
          {moving}
        </View>
      ) : (
        moving
      )}
    </KeyboardHostContext.Provider>
  );
}

/** Si la medición no vuelve (nodo desmontado), se sigue sin ese límite. */
const MEASURE_TIMEOUT_MS = 100;

function measureTop(node: View | null): Promise<number | null> {
  return new Promise((resolve) => {
    if (!node) return resolve(null);
    const timer = setTimeout(() => resolve(null), MEASURE_TIMEOUT_MS);
    node.measureInWindow((_x, y) => {
      clearTimeout(timer);
      resolve(y);
    });
  });
}

const styles = StyleSheet.create({ fill: { flex: 1 }, clip: { overflow: 'hidden' } });
