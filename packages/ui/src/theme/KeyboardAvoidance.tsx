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

/** A focused field the host has to keep in view. */
export interface KeyboardField {
  /** The field's box in window coordinates (label, field and error included). */
  measure: () => Promise<{ y: number; height: number } | null>;
}

export interface KeyboardHost {
  focus: (field: KeyboardField) => void;
  blur: (field: KeyboardField) => void;
}

const KeyboardHostContext = createContext<KeyboardHost | null>(null);

/** The active host, or null if a container already handles the keyboard (or it is off). */
export function useKeyboardHost(): KeyboardHost | null {
  return useContext(KeyboardHostContext);
}

/**
 * For containers that already keep the focused field visible on their own:
 * a Modal or BottomSheet (its own native window, which the root's shift
 * doesn't move) or a ScrollView with `automaticallyAdjustKeyboardInsets`.
 * Inside, Inputs ask nothing of the host and the keyboard isn't compensated
 * twice.
 */
export function KeyboardHandled({ children }: { children: React.ReactNode }) {
  return <KeyboardHostContext.Provider value={null}>{children}</KeyboardHostContext.Provider>;
}

/** Duration when the keyboard event doesn't carry one (Android). */
const FALLBACK_DURATION = 250;

/**
 * Vertical shift (≤ 0) so the whole field sits above the keyboard, with
 * `margin` of room, without its top edge going past `topLimit`.
 * `fieldY` is the position measured with the `current` shift applied.
 * If the field is already visible, it moves back toward 0: it never rises more than needed.
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
  // A field taller than the available gap: seeing where you type (its top
  // part) takes priority over its error.
  target = Math.max(target, topLimit - base);
  return Math.min(0, target);
}

/**
 * An area that shifts so the focused Input inside it sits above the
 * keyboard (transform on the native thread; it returns to 0 on close). It is
 * Android's `adjustPan`, the same on both platforms.
 *
 * - The root UIProvider mounts one around the whole app: the fallback, so
 *   an Input is visible even when it isn't inside a Screen.
 * - Screen mounts another around its content, with `clip`: only the content
 *   moves and the header (`header` prop) and the tab bar stay still, as in a
 *   native app. The Input registers with the nearest area, so inside a
 *   Screen the root doesn't move.
 *
 * With `clip`, whatever rises is clipped at the area's top edge and the field
 * never goes above that edge (it stays under the header).
 */
export function KeyboardPanArea({
  margin,
  topLimit,
  clip = false,
  children,
}: {
  margin: number;
  /** Top limit in window coordinates. With `clip`, the area's edge is used if it is lower. */
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
      // While measuring, focus may have moved to another field or the keyboard closed.
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
        // With the keyboard already open (moving from one field to another) it readjusts right away.
        if (keyboardTop.current !== null) void adjust(FALLBACK_DURATION);
      },
      blur(prev) {
        if (field.current === prev) field.current = null;
      },
      // Internal use by the listeners below.
      _show(e: KeyboardEvent | undefined) {
        if (!e?.endCoordinates) return;
        keyboardTop.current = e.endCoordinates.screenY;
        const duration = e.duration || FALLBACK_DURATION;
        // Android emits didShow after resizing the window: measure on the
        // next frame, with the layout already settled.
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
    // iOS notifies before animating (will*): the shift follows the keyboard.
    // Android only has did*.
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

/** If the measurement never comes back (node unmounted), carry on without that limit. */
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
