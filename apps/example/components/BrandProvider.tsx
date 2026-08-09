import React, { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { createTheme, type ThemeMode } from 'orn-ui';
import { SafeAreaUIProvider } from 'orn-ui/safe-area';

export const BRANDS = [
  { label: 'Default', hex: '#004cef' },
  { label: 'Violet', hex: '#7c3aed' },
  { label: 'Emerald', hex: '#059669' },
  { label: 'Rose', hex: '#e11d48' },
  { label: 'Amber', hex: '#f59e0b' },
];

interface BrandContextValue {
  brand: string;
  setBrand: (hex: string) => void;
}

const BrandContext = createContext<BrandContextValue | undefined>(undefined);

/**
 * Deja el color de marca en estado para que el ejemplo de theming lo cambie en
 * vivo. Una app real llama a createTheme() una sola vez, fuera del árbol.
 */
export function BrandProvider({
  children,
  mode,
  onModeChange,
}: {
  children: ReactNode;
  mode: ThemeMode;
  onModeChange: (mode: ThemeMode) => void;
}) {
  const [brand, setBrand] = useState(BRANDS[0]!.hex);
  const theme = useMemo(() => createTheme({ brand }), [brand]);
  const value = useMemo(() => ({ brand, setBrand }), [brand]);

  return (
    <BrandContext.Provider value={value}>
      <SafeAreaUIProvider theme={theme} mode={mode} onModeChange={onModeChange}>
        {children}
      </SafeAreaUIProvider>
    </BrandContext.Provider>
  );
}

export function useBrand(): BrandContextValue {
  const ctx = useContext(BrandContext);
  if (!ctx) throw new Error('useBrand must be used within a <BrandProvider>.');
  return ctx;
}
