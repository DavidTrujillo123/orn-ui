import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import { AnimatedToast, Toast, type ToastVariant } from './Toast';
import { useInsets } from '../theme/UIProvider';
import { createStyles } from '../theme/createStyles';
import { createImperativeBridge } from './imperativeBridge';

export interface ToastOptions {
  title: string;
  message?: string;
  variant?: ToastVariant;
  /** ms antes de auto-descartar. 0 = no se descarta solo. @default 4000 */
  duration?: number;
  onPress?: () => void;
  hideCloseButton?: boolean;
}

interface ToastEntry extends ToastOptions {
  id: string;
}

interface ToastContextValue {
  /** Muestra un toast y devuelve su id (por si querés cerrarlo antes de tiempo). */
  show: (options: ToastOptions) => string;
  hide: (id: string) => void;
  hideAll: () => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);
const bridge = createImperativeBridge<ToastContextValue>('ToastProvider');

/**
 * Muestra un toast desde fuera del árbol de React —un servicio, un
 * interceptor— sin pasar por el hook. Devuelve el id, o '' si no hay
 * <ToastProvider> montado.
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
  /** Máximo de toasts simultáneos; los más viejos se descartan. @default 3 */
  maxVisible?: number;
  /** Duración por defecto en ms. @default 4000 */
  defaultDuration?: number;
}

/**
 * ToastProvider
 * Monta la capa de toasts sobre el resto de la app. Colocar una vez cerca de
 * la raíz, dentro de UIProvider. Los timers de auto-dismiss se limpian al
 * desmontar y al cerrar cada toast, así que no quedan callbacks colgados.
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
        // Se descartan los más viejos, no los recién llegados: un toast nuevo
        // siempre se ve.
        const overflow = next.length - maxVisible;
        if (overflow > 0) {
          next.slice(0, overflow).forEach((t) => clearTimer(t.id));
          return next.slice(overflow);
        }
        return next;
      });

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

  // Al desmontar el provider no debe quedar ningún setTimeout apuntando a un
  // setState de un árbol ya desmontado.
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
