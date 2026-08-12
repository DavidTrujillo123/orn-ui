import React, { useEffect, useState } from 'react';
import type { ViewStyle } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  UIProvider,
  useInsets,
  type ModalSafeAreaBoundaryProps,
  type UIProviderProps,
} from '../theme/UIProvider';
import type { EdgeInsets } from '../theme/insets';

export interface SafeAreaUIProviderProps extends Omit<UIProviderProps, 'insets'> {
  insets?: UIProviderProps['insets'];
  mountSafeAreaProvider?: boolean;
}

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
  const onMeasure = React.useCallback(
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
