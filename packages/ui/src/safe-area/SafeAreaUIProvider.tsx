import React from 'react';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  UIProvider,
  type ModalSafeAreaBoundaryProps,
  type UIProviderProps,
} from '../theme/UIProvider';

export interface SafeAreaUIProviderProps extends Omit<UIProviderProps, 'insets'> {
  /**
   * Insets explícitos. Ganan sobre los medidos — útil para tests, storybook o
   * una pantalla embebida que no ocupa la ventana entera.
   */
  insets?: UIProviderProps['insets'];
  /**
   * Montar también el `<SafeAreaProvider>`. Ponelo en false si tu app ya tiene
   * uno arriba (React Navigation lo monta solo en algunas plantillas):
   * un provider anidado mide el frame de *su* View, no el de la ventana, así
   * que ahí adentro los insets darían cero.
   * @default true
   */
  mountSafeAreaProvider?: boolean;
}

function ModalBoundaryInner({ children }: ModalSafeAreaBoundaryProps) {
  // Este hook lee del `SafeAreaProvider` más cercano — el que
  // `RemeasuringModalSafeAreaBoundary` monta a propósito adentro del árbol
  // del Modal, no el de la raíz. Un `<Modal>`/`<BottomSheet>` de RN abre su
  // propia ventana nativa (siempre en Android, según `presentationStyle` en
  // iOS), y los insets de la raíz no siempre valen ahí adentro: mismo bug que
  // documenta react-native-safe-area-context para modales anidados.
  const insets = useSafeAreaInsets();
  return <>{children(insets)}</>;
}

function RemeasuringModalSafeAreaBoundary({ children }: ModalSafeAreaBoundaryProps) {
  return (
    <SafeAreaProvider>
      <ModalBoundaryInner>{children}</ModalBoundaryInner>
    </SafeAreaProvider>
  );
}

function Measured({ insets: override, children, ...rest }: SafeAreaUIProviderProps) {
  const measured = useSafeAreaInsets();
  return (
    <UIProvider
      insets={override ?? measured}
      ModalSafeAreaBoundary={RemeasuringModalSafeAreaBoundary}
      {...rest}
    >
      {children}
    </UIProvider>
  );
}

/**
 * SafeAreaUIProvider
 * `UIProvider` con los insets ya cableados desde `react-native-safe-area-context`.
 *
 * Vive en su propio subpath (`orn-ui/safe-area`) a propósito: es el único
 * archivo de la librería que importa un paquete de terceros. Nada del entry
 * principal lo referencia, así que quien hace `import { Button } from 'orn-ui'`
 * nunca lo resuelve y el bundle sigue sin dependencias de runtime.
 *
 * ```tsx
 * import { SafeAreaUIProvider } from 'orn-ui/safe-area';
 *
 * export default function App() {
 *   return (
 *     <SafeAreaUIProvider defaultMode="system">
 *       <RootNavigator />
 *     </SafeAreaUIProvider>
 *   );
 * }
 * ```
 *
 * El equivalente a mano — pasarle `insets={useSafeAreaInsets()}` a `UIProvider`
 * desde un componente que ya esté dentro de `<SafeAreaProvider>` — sigue
 * siendo válido. Esto sólo evita el error silencioso de olvidarlo: `insets`
 * por defecto es `{0,0,0,0}`, y con ceros el bottom sheet queda pegado contra
 * la barra de gestos y el modal `full` se mete abajo del notch.
 */
export function SafeAreaUIProvider({
  mountSafeAreaProvider = true,
  ...props
}: SafeAreaUIProviderProps) {
  if (!mountSafeAreaProvider) return <Measured {...props} />;
  return (
    <SafeAreaProvider>
      <Measured {...props} />
    </SafeAreaProvider>
  );
}
