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
  // Controlado con estado propio. Antes se pasaba `mode="system"` fijo: como
  // `mode` es la prop *controlada* del provider, el ThemeToggle llamaba a
  // setMode, el provider delegaba en `onModeChange` (que no existía) y el tema
  // nunca cambiaba — el modo oscuro solo se podía activar desde el sistema.
  const [mode, setMode] = useState<ThemeMode>('system');
  // BrandProvider monta el SafeAreaUIProvider (que mide los insets: olvidarlos
  // deja los modales abajo del notch) con el theme derivado del color de marca
  // que el ejemplo de theming cambia en vivo.
  return (
    <BrandProvider mode={mode} onModeChange={setMode}>
      <AlertProvider>
        <ToastProvider>{children}</ToastProvider>
      </AlertProvider>
    </BrandProvider>
  );
}

/**
 * El Stack de expo-router (y cada Stack anidado en las tabs) pinta su propio
 * fondo detrás de las pantallas usando el theme de *react-navigation*, no el
 * de orn-ui. Sin `ThemeProvider` acá cae en su `DefaultTheme` (gris claro
 * hardcodeado, rgb(242,242,242)) sin importar el modo — eso es el parpadeo
 * blanco al navegar entre tabs (el Background de cada tab, el contentStyle
 * de los Stacks anidados y el nativeContainerStyle de cada uno lo leen de
 * ahí). `sceneStyle` en contentStyle solo tapaba el Stack raíz, no los
 * anidados de atoms/molecules/organisms/examples.
 *
 * SystemUI.setBackgroundColorAsync sincroniza el window background nativo de
 * Android (fuera de lo que React pinta) para que tampoco asome blanco en el
 * primer frame de montaje de una tab lazy.
 *
 * La status bar se invierte respecto del fondo resuelto, no del esquema del
 * sistema — si no, en "Dark" forzado sobre un sistema claro los íconos
 * quedaban negros sobre negro.
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
