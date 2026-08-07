import React from 'react';
import { ThemeToggle } from 'orn-ui';
import { VariantList, type VariantDef } from '@/components/VariantList';

export function ThemeToggleDemo() {
  // #region demo
  const variants: VariantDef[] = [
    { label: 'Default labels', content: <ThemeToggle /> },
    { label: 'Custom labels', content: <ThemeToggle labels={{ system: 'System', light: 'Day', dark: 'Night' }} /> },
  ];
  return <VariantList variants={variants} />;
  // #endregion demo
}
