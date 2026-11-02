import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { AlertProvider, ToastProvider, useColors, useThemeMode } from 'orn-ui';
import { BrandProvider } from '@/components/BrandProvider';
import { Stack } from 'expo-router';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@/components/navigationTheme';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';
import * as SystemUI from 'expo-system-ui';
import type { ThemeMode } from 'orn-ui';

function Providers({ children }: { children: ReactNode }) {
  // Controlled with its own state. It used to pass a fixed `mode="system"`:
  // since `mode` is the provider's *controlled* prop, ThemeToggle called
  // setMode, the provider delegated to `onModeChange` (which didn't exist) and
  // the theme never changed — dark mode could only be turned on from the system.
  const [mode, setMode] = useState<ThemeMode>('system');
  // BrandProvider mounts the UIProvider (which measures the insets: forgetting
  // them leaves modals under the notch) with the theme derived from the brand
  // color that the theming example changes live.
  return (
    <BrandProvider mode={mode} onModeChange={setMode}>
      <AlertProvider>
        <ToastProvider>{children}</ToastProvider>
      </AlertProvider>
    </BrandProvider>
  );
}

/**
 * expo-router's Stack (and each Stack nested in the tabs) paints its own
 * background behind the screens using *react-navigation*'s theme, not
 * orn-ui's. Without a `ThemeProvider` here it falls back to its `DefaultTheme`
 * (hardcoded light gray, rgb(242,242,242)) regardless of the mode — that is
 * the white flicker when navigating between tabs (each tab's Background, the
 * nested Stacks' contentStyle and each one's nativeContainerStyle read it
 * from there). `sceneStyle` in contentStyle only covered the root Stack, not
 * the nested atoms/molecules/organisms/examples ones.
 *
 * SystemUI.setBackgroundColorAsync syncs Android's native window background
 * (outside what React paints) so white doesn't peek through on the first
 * mount frame of a lazy tab either.
 *
 * The status bar is inverted relative to the resolved background, not the
 * system scheme — otherwise, with "Dark" forced on a light system, the icons
 * ended up black on black.
 */
function ThemedStack() {
  const colors = useColors();
  const { mode } = useThemeMode();
  const systemScheme = useColorScheme();
  const isDark = mode === 'system' ? systemScheme === 'dark' : mode === 'dark';

  const navTheme = useMemo(() => {
    const base = isDark ? DarkTheme : DefaultTheme;
    return {
      ...base,
      dark: isDark,
      colors: {
        ...base.colors,
        primary: colors.primary,
        background: colors.background,
        card: colors.surface,
        text: colors.text,
        border: colors.border,
      },
    };
  }, [isDark, colors]);

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(colors.background);
  }, [colors.background]);

  return (
    <ThemeProvider value={navTheme}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerTitleAlign: 'center',
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <Providers>
      <ThemedStack />
    </Providers>
  );
}
