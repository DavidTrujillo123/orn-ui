import { useState, type ReactNode } from 'react';
import { AlertProvider, ToastProvider, useColors, useThemeMode } from 'orn-ui';
import { SafeAreaUIProvider } from 'orn-ui/safe-area';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';
import type { ThemeMode } from 'orn-ui';

function Providers({ children }: { children: ReactNode }) {
  // Controlado con estado propio. Antes se pasaba `mode="system"` fijo: como
  // `mode` es la prop *controlada* del provider, el ThemeToggle llamaba a
  // setMode, el provider delegaba en `onModeChange` (que no existía) y el tema
  // nunca cambiaba — el modo oscuro solo se podía activar desde el sistema.
  const [mode, setMode] = useState<ThemeMode>('system');
  // SafeAreaUIProvider monta el SafeAreaProvider y mide los insets él mismo;
  // olvidarlos deja los modales abajo del notch y el bottom sheet contra la
  // barra de gestos.
  return (
    <SafeAreaUIProvider mode={mode} onModeChange={setMode}>
      <AlertProvider>
        <ToastProvider>{children}</ToastProvider>
      </AlertProvider>
    </SafeAreaUIProvider>
  );
}

/**
 * El Stack de expo-router pinta su propio fondo (blanco por defecto) detrás de
 * las pantallas: sin esto se ve un flash claro en cada navegación con el tema
 * oscuro activo. La status bar se invierte respecto del fondo resuelto, no del
 * esquema del sistema — si no, en "Dark" forzado sobre un sistema claro los
 * íconos quedaban negros sobre negro.
 */
function ThemedStack() {
  const colors = useColors();
  const { mode } = useThemeMode();
  const systemScheme = useColorScheme();
  const isDark = mode === 'system' ? systemScheme === 'dark' : mode === 'dark';

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerTitleAlign: 'center',
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <Providers>
      <ThemedStack />
    </Providers>
  );
}
