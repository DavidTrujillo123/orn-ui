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
  /** Shows the confirm button as destructive/red (for "delete", etc.). */
  destructive?: boolean;
}

interface AlertContextValue {
  /** Shows a single-button alert. Resolves when it closes. */
  alert: (options: AlertOptions) => Promise<void>;
  /** Shows confirm/cancel. Resolves true if confirmed, false if cancelled. */
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  hide: () => void;
}

const AlertContext = createContext<AlertContextValue | undefined>(undefined);
const bridge = createImperativeBridge<AlertContextValue>('AlertProvider');

/**
 * Opens an alert from outside the React tree —a service, an interceptor—
 * without going through the hook. Without a mounted <AlertProvider> it
 * resolves immediately, so an `await` never hangs.
 */
export function showAlert(options: AlertOptions): Promise<void> {
  return bridge.get()?.alert(options) ?? Promise.resolve();
}

/** Same as showAlert, but resolves true/false. Without a provider, false. */
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
 * Mounts a single imperatively controlled <Alert>. Place it once near the
 * root (inside UIProvider). Async handlers can do
 * `const ok = await confirm({ title: 'Delete', destructive: true })`.
 */
export function AlertProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<InternalState>(HIDDEN);
  const resolverRef = useRef<((value: any) => void) | null>(null);
  // If alert()/confirm() are called again while one is already open, the
  // previous request is resolved (not discarded) before showing the new one:
  // this keeps its promise from hanging forever.
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
