import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

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
