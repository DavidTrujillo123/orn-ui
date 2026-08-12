import React, { createContext, useContext, useMemo, useState, useCallback, useRef } from 'react';
import { Appearance, useColorScheme } from 'react-native';
import { defaultTheme } from './createTheme';
import { defaultLabels, type Labels } from './labels';
import { zeroInsets, type EdgeInsets } from './insets';
import type { Theme, ThemePair } from './types';
import { renderDefaultIcon } from '../icons/defaultIcons';
import type { IconRenderer } from '../icons/types';

export type ThemeMode = 'system' | 'light' | 'dark';

/**
 * Un `<Modal>`/`<BottomSheet>` nativo abre su propia ventana (en Android
 * siempre; en iOS según `presentationStyle`), así que los insets medidos en
 * la raíz de la app pueden no valer ahí adentro. Este boundary es el punto de
 * inyección: el default sólo repite los insets ambientes (comportamiento de
 * siempre, cero deps), pero `SafeAreaUIProvider` lo reemplaza por uno que
 * monta un `<SafeAreaProvider>` nuevo y remide dentro de esa ventana.
 */
export interface ModalSafeAreaBoundaryProps {
  children: (insets: EdgeInsets) => React.ReactNode;
}
export type ModalSafeAreaBoundaryComponent = React.ComponentType<ModalSafeAreaBoundaryProps>;

function DefaultModalSafeAreaBoundary({ children }: ModalSafeAreaBoundaryProps) {
  const insets = useInsets();
  return <>{children(insets)}</>;
}

interface UIContextValue {
  theme: Theme;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  icons: IconRenderer;
  insets: EdgeInsets;
  labels: Labels;
  allowFontScaling: boolean;
  ModalSafeAreaBoundary: ModalSafeAreaBoundaryComponent;
}

const UIContext = createContext<UIContextValue | undefined>(undefined);

export interface UIProviderProps {
  children: React.ReactNode;
  /** Par light/dark. Por defecto el theme de marca de la librería (créalo con createTheme()). */
  theme?: ThemePair;
  /** Modo inicial (no controlado) si no se pasa `mode`. @default 'system' */
  defaultMode?: ThemeMode;
  /** Modo controlado. Si se pasa junto a onModeChange, el provider no gestiona estado propio. */
  mode?: ThemeMode;
  onModeChange?: (mode: ThemeMode) => void;
  /** Renderer de íconos. Por defecto usa los glifos zero-dep incluidos. */
  icons?: IconRenderer;
  /** Insets de safe area (de useSafeAreaInsets()). Por defecto {0,0,0,0}. */
  insets?: EdgeInsets;
  labels?: Partial<Labels>;
  /** @default false, para paridad con el resto de la librería (accesibilidad primero). */
  allowFontScaling?: boolean;
  /**
   * Fuente de insets que usan `Modal`/`BottomSheet` para su propia ventana
   * nativa. No la pases a mano — `SafeAreaUIProvider` la cablea sola.
   * @default repite los insets ambientes (comportamiento sin safe-area-context)
   */
  ModalSafeAreaBoundary?: ModalSafeAreaBoundaryComponent;
}

/**
 * UIProvider
 * Único punto de entrada de la librería: resuelve el theme activo (sistema u
 * override manual), e inyecta íconos, insets y textos por defecto a todo el
 * árbol. No persiste el modo — si el consumidor quiere recordar la preferencia
 * entre sesiones, controla `mode`/`onModeChange` y persiste donde prefiera.
 */
export function UIProvider({
  children,
  theme = defaultTheme,
  defaultMode = 'system',
  mode: controlledMode,
  onModeChange,
  icons = renderDefaultIcon,
  insets = zeroInsets,
  labels: labelOverrides,
  allowFontScaling = false,
  ModalSafeAreaBoundary = DefaultModalSafeAreaBoundary,
}: UIProviderProps) {
  const systemScheme = useColorScheme();
  const [uncontrolledMode, setUncontrolledMode] = useState<ThemeMode>(defaultMode);
  const isControlled = controlledMode !== undefined;
  const mode = isControlled ? controlledMode : uncontrolledMode;

  const setMode = useCallback(
    (next: ThemeMode) => {
      if (!isControlled) setUncontrolledMode(next);
      onModeChange?.(next);
    },
    [isControlled, onModeChange]
  );

  // Por instancia, no por módulo: dos `<UIProvider>` en el mismo árbol (tests,
  // un modal con su propio provider) avisan cada uno si le faltan insets, en
  // vez de que el segundo se calle porque el primero ya avisó una vez.
  const warnedAboutInsets = useRef(false);

  // Olvidar `insets` no rompe nada visible al montar: el default de ceros
  // recién se nota cuando abrís un Modal `full` (se mete abajo del notch) o un
  // BottomSheet (queda pegado a la barra de gestos). El aviso llega antes.
  if (__DEV__ && insets === zeroInsets && !warnedAboutInsets.current) {
    warnedAboutInsets.current = true;
    console.warn(
      'orn-ui: <UIProvider> sin `insets`, se usan {top:0,bottom:0,left:0,right:0}. ' +
        'Los modales y el Screen quedan sin safe area. Pasá `insets={useSafeAreaInsets()}` ' +
        "o usá <SafeAreaUIProvider> de 'orn-ui/safe-area', que lo cablea solo."
    );
  }

  const scheme: 'light' | 'dark' =
    mode === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : mode;

  const resolvedTheme = theme[scheme];

  const labels = useMemo(
    () => (labelOverrides ? { ...defaultLabels, ...labelOverrides } : defaultLabels),
    [labelOverrides]
  );

  const value = useMemo<UIContextValue>(
    () => ({
      theme: resolvedTheme,
      mode,
      setMode,
      icons,
      insets,
      labels,
      allowFontScaling,
      ModalSafeAreaBoundary,
    }),
    [resolvedTheme, mode, setMode, icons, insets, labels, allowFontScaling, ModalSafeAreaBoundary]
  );

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}

function useUIContext(): UIContextValue {
  const ctx = useContext(UIContext);
  if (!ctx) {
    throw new Error('orn-ui: this hook must be used within a <UIProvider>.');
  }
  return ctx;
}

export function useTheme(): Theme {
  return useUIContext().theme;
}

export function useColors(): Theme['colors'] {
  return useUIContext().theme.colors;
}

export function useThemeMode() {
  const { mode, setMode } = useUIContext();
  return { mode, setMode };
}

export function useIcons(): IconRenderer {
  return useUIContext().icons;
}

export function useInsets(): EdgeInsets {
  return useUIContext().insets;
}

export function useLabels(): Labels {
  return useUIContext().labels;
}

export function useAllowFontScaling(): boolean {
  return useUIContext().allowFontScaling;
}

/** Interno: lo consumen `Modal`/`BottomSheet` para remedir insets dentro de su propia ventana nativa. */
export function useModalSafeAreaBoundary(): ModalSafeAreaBoundaryComponent {
  return useUIContext().ModalSafeAreaBoundary;
}

/** Re-exportado para que tests/consumidores puedan simular cambios de sistema sin RN real. */
export const __testUtils = { Appearance };
