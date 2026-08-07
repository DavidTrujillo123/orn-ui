import React from 'react';
import { AvatarHeader } from 'orn-ui';
import { VariantList, type VariantDef } from '@/components/VariantList';

export function AvatarHeaderDemo() {
  // #region demo
  const variants: VariantDef[] = [
    { label: 'With initials', content: <AvatarHeader initials="JD" title="Jane Doe" subtitle="Customer since 2023" /> },
    { label: 'With icon', content: <AvatarHeader iconName="check" title="Order confirmed" subtitle="#A-10492" /> },
    { label: 'Custom iconColor', content: <AvatarHeader iconName="info" iconColor="#00cae1" title="Account details" /> },
  ];
  return <VariantList variants={variants} />;
  // #endregion demo
}
