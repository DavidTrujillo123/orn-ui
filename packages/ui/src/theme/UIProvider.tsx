import React, { createContext, useContext, useMemo, useState, useCallback, useEffect } from 'react';
import { Appearance, useColorScheme, type ViewStyle } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { defaultTheme } from './createTheme';
import { defaultLabels, type Labels } from './labels';
import type { EdgeInsets } from './insets';
import type { Theme, ThemePair } from './types';
import { renderDefaultIcon } from '../icons/defaultIcons';
import type { IconRenderer } from '../icons/types';
import { KeyboardHandled, KeyboardPanArea } from './KeyboardAvoidance';

export type ThemeMode = 'system' | 'light' | 'dark';

/**
 * A native `<Modal>`/`<BottomSheet>` opens its own window (always on Android;
 * on iOS depending on `presentationStyle`), so the insets measured at the app
 * root may not hold in there. The boundary mounts a new `<SafeAreaProvider>`
 * inside that window and re-measures; until the first measurement arrives it
 * repeats the ambient insets.
 */
export interface ModalSafeAreaBoundaryProps {
  children: (insets: EdgeInsets) => React.ReactNode;
}
export type ModalSafeAreaBoundaryComponent = React.ComponentType<ModalSafeAreaBoundaryProps>;

const probeStyle: ViewStyle = { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 };

function sameInsets(a: EdgeInsets, b: EdgeInsets) {
  return a.top === b.top && a.right === b.right && a.bottom === b.bottom && a.left === b.left;
}

function InsetsProbe({ onMeasure }: { onMeasure: (insets: EdgeInsets) => void }) {
  const insets = useSafeAreaInsets();
  useEffect(() => {
    onMeasure(insets);
  }, [insets, onMeasure]);
  return null;
}

function RemeasuringModalSafeAreaBoundary({ children }: ModalSafeAreaBoundaryProps) {
  const ambient = useInsets();
  const [measured, setMeasured] = useState<EdgeInsets | null>(null);
  const onMeasure = useCallback(
    (next: EdgeInsets) => setMeasured((prev) => (prev && sameInsets(prev, next) ? prev : next)),
    []
  );

  return (
    <>
      <SafeAreaProvider style={probeStyle} pointerEvents="none">
        <InsetsProbe onMeasure={onMeasure} />
      </SafeAreaProvider>
      {children(measured ?? ambient)}
    </>
  );
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
  /** Light/dark pair. Defaults to the library's brand theme (create one with createTheme()). */
  theme?: ThemePair;
  /** Initial mode (uncontrolled) if `mode` isn't passed. @default 'system' */
  defaultMode?: ThemeMode;
  /** Controlled mode. If passed together with onModeChange, the provider doesn't manage its own state. */
  mode?: ThemeMode;
  onModeChange?: (mode: ThemeMode) => void;
  /** Icon renderer. Defaults to the included zero-dep glyphs. */
  icons?: IconRenderer;
  /**
   * Overrides the measured safe area insets. Leave it out: the provider
   * measures them itself with react-native-safe-area-context.
   */
  insets?: EdgeInsets;
  labels?: Partial<Labels>;
  /**
   * Lets every orn-ui text follow the system font size (Dynamic Type / Android
   * font scale). Opt-in: layouts are tuned for the default size, so turn it on
   * only after checking your screens at large sizes.
   * @default false
   */
  allowFontScaling?: boolean;
  /**
   * Mounts a `<SafeAreaProvider>` around the app. Pass `false` only if the app
   * already mounts one above (e.g. expo-router does): insets are then read
   * from that one.
   * @default true
   */
  mountSafeAreaProvider?: boolean;
  /**
   * Keeps the focused Input visible above the keyboard by moving the whole app
   * up just enough (like Android's adjustPan, on both platforms), with no
   * Screen or ScrollView needed. Only the root provider does it. Turn it off if
   * your app already handles the keyboard its own way.
   * @default true
   */
  keyboardAvoidance?: boolean;
}

interface UIProviderBaseProps extends Omit<UIProviderProps, 'insets' | 'mountSafeAreaProvider'> {
  insets: EdgeInsets;
}

/**
 * UIProvider
 * The library's single entry point: resolves the active theme (system or
 * manual override), measures the safe area insets (react-native-safe-area-context,
 * a required peer) and injects icons, insets and default texts into the whole
 * tree. It doesn't persist the mode — if the consumer wants to remember the
 * preference across sessions, it controls `mode`/`onModeChange` and persists
 * wherever it prefers.
 */
export function UIProvider({ mountSafeAreaProvider = true, ...props }: UIProviderProps) {
  if (!mountSafeAreaProvider) return <MeasuredUIProvider {...props} />;
  return (
    <SafeAreaProvider>
      <MeasuredUIProvider {...props} />
    </SafeAreaProvider>
  );
}

function MeasuredUIProvider({ insets: override, ...rest }: Omit<UIProviderProps, 'mountSafeAreaProvider'>) {
  const measured = useSafeAreaInsets();
  return <UIProviderBase insets={override ?? measured} {...rest} />;
}

function UIProviderBase({
  children,
  theme = defaultTheme,
  defaultMode = 'system',
  mode: controlledMode,
  onModeChange,
  icons = renderDefaultIcon,
  insets,
  labels: labelOverrides,
  allowFontScaling = false,
  keyboardAvoidance = true,
}: UIProviderBaseProps) {
  // Only the root provider shifts the app: a nested one (a modal with its own
  // provider, a test) wraps nothing and doesn't change the layout.
  const isRoot = useContext(UIContext) === undefined;
  const ModalSafeAreaBoundary = RemeasuringModalSafeAreaBoundary;
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

  let content = children;
  if (isRoot) {
    content = keyboardAvoidance ? (
      <KeyboardPanArea margin={resolvedTheme.tokens.spacing.md} topLimit={insets.top}>
        {children}
      </KeyboardPanArea>
    ) : (
      <KeyboardHandled>{children}</KeyboardHandled>
    );
  }

  return <UIContext.Provider value={value}>{content}</UIContext.Provider>;
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

/** Internal: consumed by `Modal`/`BottomSheet` to re-measure insets inside their own native window. */
export function useModalSafeAreaBoundary(): ModalSafeAreaBoundaryComponent {
  return useUIContext().ModalSafeAreaBoundary;
}

/** Re-exported so tests/consumers can simulate system changes without real RN. */
export const __testUtils = { Appearance };
