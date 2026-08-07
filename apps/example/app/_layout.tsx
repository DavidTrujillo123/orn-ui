import type { ReactNode } from 'react';
import { AlertProvider, ToastProvider, UIProvider } from 'orn-ui';
import { Stack } from 'expo-router';
import { useSafeAreaInsets, SafeAreaProvider } from 'react-native-safe-area-context';

function Providers({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <UIProvider mode="system" insets={insets}>
      <AlertProvider>
        <ToastProvider>{children}</ToastProvider>
      </AlertProvider>
    </UIProvider>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <Providers>
        <Stack screenOptions={{ headerTitleAlign: 'center' }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
      </Providers>
    </SafeAreaProvider>
  );
}
