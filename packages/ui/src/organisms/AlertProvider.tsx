import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, type AlertButton, type AlertType } from './Alert';
import { createImperativeBridge } from './imperativeBridge';

export interface AlertOptions {
  title: string;
  message?: string;
  type?: AlertType;
  confirmText?: string;
  cancelText?: string;
}

export interface ConfirmOptions extends AlertOptions {
  /** Botón de confirmar en rojo/destructivo (para "eliminar", etc). */
  destructive?: boolean;
}

interface AlertContextValue {
  /** Muestra un alert de un solo botón. Resuelve cuando se cierra. */
  alert: (options: AlertOptions) => Promise<void>;
  /** Muestra confirmar/cancelar. Resuelve true si se confirmó, false si se canceló. */
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  hide: () => void;
}

const AlertContext = createContext<AlertContextValue | undefined>(undefined);
const bridge = createImperativeBridge<AlertContextValue>('AlertProvider');

/**
 * Abre un alert desde fuera del árbol de React —un servicio, un interceptor—
 * sin pasar por el hook. Sin <AlertProvider> montado resuelve de inmediato, así
 * que un `await` nunca queda colgado.
 */
export function showAlert(options: AlertOptions): Promise<void> {
  return bridge.get()?.alert(options) ?? Promise.resolve();
}

/** Igual que showAlert, pero resuelve true/false. Sin provider, false. */
export function showConfirm(options: ConfirmOptions): Promise<boolean> {
  return bridge.get()?.confirm(options) ?? Promise.resolve(false);
}

export function hideAlert(): void {
  bridge.get()?.hide();
}

interface InternalState {
  visible: boolean;
  title: string;
  message?: string;
  type: AlertType;
  buttons: AlertButton[];
}

const HIDDEN: InternalState = { visible: false, title: '', type: 'info', buttons: [] };

/**
 * AlertProvider
 * Monta un único <Alert> controlado imperativamente. Colocar una vez cerca
 * de la raíz (dentro de UIProvider). Los handlers async pueden hacer
 * `const ok = await confirm({ title: 'Eliminar', destructive: true })`.
 */
export function AlertProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<InternalState>(HIDDEN);
  const resolverRef = useRef<((value: any) => void) | null>(null);
  // Si alert()/confirm() se llaman de nuevo mientras ya hay uno abierto, el
  // pedido anterior se resuelve (no se descarta) antes de mostrar el nuevo:
  // evita que su promise quede colgada para siempre.
  const settlePending = useCallback(() => {
    resolverRef.current?.(undefined);
    resolverRef.current = null;
  }, []);

  const hide = useCallback(() => {
    setState(HIDDEN);
    settlePending();
  }, [settlePending]);

  const alertFn = useCallback((options: AlertOptions): Promise<void> => {
    settlePending();
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      setState({
        visible: true,
        title: options.title,
        message: options.message,
        type: options.type ?? 'info',
        buttons: [
          {
            text: options.confirmText ?? 'OK',
            onPress: () => {
              setState(HIDDEN);
              resolve();
              resolverRef.current = null;
            },
          },
        ],
      });
    });
  }, [settlePending]);

  const confirmFn = useCallback((options: ConfirmOptions): Promise<boolean> => {
    settlePending();
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      setState({
        visible: true,
        title: options.title,
        message: options.message,
        type: options.type ?? 'question',
        buttons: [
          {
            text: options.cancelText ?? 'Cancel',
            style: 'cancel',
            variant: 'outline',
            onPress: () => {
              setState(HIDDEN);
              resolve(false);
              resolverRef.current = null;
            },
          },
          {
            text: options.confirmText ?? 'OK',
            variant: options.destructive ? 'destructive' : 'primary',
            style: options.destructive ? 'destructive' : 'default',
            onPress: () => {
              setState(HIDDEN);
              resolve(true);
              resolverRef.current = null;
            },
          },
        ],
      });
    });
  }, [settlePending]);

  const value = useMemo<AlertContextValue>(() => ({ alert: alertFn, confirm: confirmFn, hide }), [alertFn, confirmFn, hide]);

  useEffect(() => {
    bridge.set(value);
    return () => bridge.set(null);
  }, [value]);

  return (
    <AlertContext.Provider value={value}>
      {children}
      <Alert visible={state.visible} title={state.title} message={state.message} type={state.type} buttons={state.buttons} onClose={hide} />
    </AlertContext.Provider>
  );
}

export function useAlert(): AlertContextValue {
  const ctx = useContext(AlertContext);
  if (!ctx) {
    throw new Error('orn-ui: useAlert must be used within an <AlertProvider>.');
  }
  return ctx;
}
