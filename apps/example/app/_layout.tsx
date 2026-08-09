import { useState, type ReactNode } from 'react';
import { AlertProvider, ToastProvider, useColors, useThemeMode } from 'orn-ui';
import { BrandProvider } from '@/components/BrandProvider';
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
