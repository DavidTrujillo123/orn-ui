import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, View } from 'react-native';
import { AnimatedToast, Toast, type ToastVariant } from './Toast';
import { useInsets } from '../theme/UIProvider';
import { createStyles } from '../theme/createStyles';
import { createImperativeBridge } from './imperativeBridge';

export interface ToastOptions {
  title: string;
  message?: string;
  variant?: ToastVariant;
  /** Milliseconds before auto-dismiss. 0 = never dismisses on its own. @default 4000 */
  duration?: number;
  onPress?: () => void;
  hideCloseButton?: boolean;
}

interface ToastEntry extends ToastOptions {
  id: string;
}

interface ToastContextValue {
  /** Shows a toast and returns its id (to close it early if needed). */
  show: (options: ToastOptions) => string;
  hide: (id: string) => void;
  hideAll: () => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);
const bridge = createImperativeBridge<ToastContextValue>('ToastProvider');

/**
 * Shows a toast from outside the React tree —a service, an interceptor—
 * without going through the hook. Returns the id, or '' if there is no
 * mounted <ToastProvider>.
 */
export function showToast(options: ToastOptions): string {
  return bridge.get()?.show(options) ?? '';
}

export function hideToast(id: string): void {
  bridge.get()?.hide(id);
}

export function hideAllToasts(): void {
  bridge.get()?.hideAll();
}

const useStyles = createStyles((theme) => ({
  host: { position: 'absolute', left: 0, right: 0, paddingHorizontal: theme.tokens.spacing.lg, gap: theme.tokens.spacing.sm },
}));

export interface ToastProviderProps {
  children: React.ReactNode;
  /** @default 'top' */
  position?: 'top' | 'bottom';
  /** Maximum simultaneous toasts; the oldest ones are dropped. @default 3 */
  maxVisible?: number;
  /** Default duration in ms. @default 4000 */
  defaultDuration?: number;
}

/**
 * ToastProvider
 * Mounts the toast layer above the rest of the app. Place it once near the
 * root, inside UIProvider. The auto-dismiss timers are cleared on unmount and
 * when each toast closes, so no callbacks are left hanging.
 */
export function ToastProvider({
  children,
  position = 'top',
  maxVisible = 3,
  defaultDuration = 4000,
}: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastEntry[]>([]);
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const counter = useRef(0);
  const insets = useInsets();
  const styles = useStyles();

  const clearTimer = useCallback((id: string) => {
    const t = timers.current.get(id);
    if (t) {
      clearTimeout(t);
      timers.current.delete(id);
    }
  }, []);

  const hide = useCallback(
    (id: string) => {
      clearTimer(id);
      setToasts((prev) => prev.filter((t) => t.id !== id));
    },
    [clearTimer]
  );

  const hideAll = useCallback(() => {
    timers.current.forEach((t) => clearTimeout(t));
    timers.current.clear();
    setToasts([]);
  }, []);

  const show = useCallback(
    (options: ToastOptions) => {
      counter.current += 1;
      const id = `toast-${counter.current}`;
      const duration = options.duration ?? defaultDuration;

      setToasts((prev) => {
        const next = [...prev, { ...options, id }];
        // The oldest are dropped, not the newcomers: a new toast is always
        // visible.
        const overflow = next.length - maxVisible;
        if (overflow > 0) {
          next.slice(0, overflow).forEach((t) => clearTimer(t.id));
          return next.slice(overflow);
        }
        return next;
      });

      // It appears without focus: screen readers only hear it if it is
      // announced (iOS ignores accessibilityRole="alert" on its own).
      AccessibilityInfo.announceForAccessibility(options.message ? `${options.title}. ${options.message}` : options.title);

      if (duration > 0) {
        timers.current.set(
          id,
          setTimeout(() => hide(id), duration)
        );
      }
      return id;
    },
    [defaultDuration, maxVisible, hide, clearTimer]
  );

  // When the provider unmounts no setTimeout must be left pointing at a
  // setState of an already unmounted tree.
  useEffect(() => {
    const pending = timers.current;
    return () => {
      pending.forEach((t) => clearTimeout(t));
      pending.clear();
    };
  }, []);

  const value = useMemo<ToastContextValue>(() => ({ show, hide, hideAll }), [show, hide, hideAll]);

  useEffect(() => {
    bridge.set(value);
    return () => bridge.set(null);
  }, [value]);

  const hostPosition =
    position === 'top'
      ? { top: insets.top + 8 }
      : { bottom: insets.bottom + 8, flexDirection: 'column-reverse' as const };

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toasts.length > 0 && (
        <View style={[styles.host, hostPosition]} pointerEvents="box-none" testID="toast-host">
          {toasts.map((t) => (
            <AnimatedToast key={t.id}>
              <Toast
                title={t.title}
                message={t.message}
                variant={t.variant}
                hideCloseButton={t.hideCloseButton}
                onDismiss={() => hide(t.id)}
                onPress={
                  t.onPress
                    ? () => {
                        t.onPress?.();
                        hide(t.id);
                      }
                    : undefined
                }
              />
            </AnimatedToast>
          ))}
        </View>
      )}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('orn-ui: useToast must be used within a <ToastProvider>.');
  }
  return ctx;
}
