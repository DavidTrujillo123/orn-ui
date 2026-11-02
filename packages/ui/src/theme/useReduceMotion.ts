import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/**
 * Follows the system "reduce motion" setting: when it is on, animations jump
 * to their final state instead of being disabled, so callbacks and unmounting
 * still happen the same way.
 */
export function useReduceMotion(): boolean {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let alive = true;
    // The state is only updated if the setting is on: the initial value is
    // already `false` and a setState from false to false would cost a render per mount.
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
