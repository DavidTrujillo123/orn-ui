import { useMemo, useRef, type RefObject } from 'react';
import type { View } from 'react-native';
import { useKeyboardHost, type KeyboardField } from './KeyboardAvoidance';

/**
 * Registers a text field with the nearest keyboard host (a Screen's content or
 * the root UIProvider) so it stays visible above the keyboard. `boxRef` is the
 * block that has to be seen whole: label, field and error.
 *
 * Call `focus()` from the TextInput's onFocus (and again when the block grows,
 * e.g. an error shows up while typing) and `blur()` from onBlur. Inside a
 * container that already handles the keyboard there is no host and both are
 * no-ops.
 */
export function useKeyboardField(boxRef: RefObject<View | null>) {
  const host = useKeyboardHost();
  const field = useRef<KeyboardField>({
    measure: () =>
      new Promise((resolve) => {
        const node = boxRef.current;
        if (!node) return resolve(null);
        node.measureInWindow((_x, y, _w, height) => resolve({ y, height }));
      }),
  }).current;

  return useMemo(
    () => ({
      focus: () => host?.focus(field),
      blur: () => host?.blur(field),
    }),
    [host, field]
  );
}
