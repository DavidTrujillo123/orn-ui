import React from 'react';
import { AvatarHeader, useColors } from 'orn-ui';
import { VariantList, type VariantDef } from '@/components/VariantList';

// The icon takes a theme "Text" color: it keeps AA contrast on the soft fill.
function OrderConfirmedHeader() {
  const colors = useColors();
  return <AvatarHeader iconName="check" iconColor={colors.successText} title="Order confirmed" subtitle="#A-10492" />;
}

export function AvatarHeaderDemo() {
  // #region demo
  const variants: VariantDef[] = [
    { label: 'With initials', content: <AvatarHeader initials="JD" title="Jane Doe" subtitle="Customer since 2023" /> },
    { label: 'With icon', content: <AvatarHeader iconName="star" title="Gold member" subtitle="1,240 points" /> },
    {
      label: 'iconColor — keep AA on the soft fill',
      content: <OrderConfirmedHeader />,
    },
    { label: 'No icon or initials — user fallback', content: <AvatarHeader title="Guest" subtitle="Not signed in" /> },
    {
      label: 'Long text wraps centered',
      content: (
        <AvatarHeader
          initials="MR"
          title="María Fernanda Rodríguez Villalobos"
          subtitle="Regional operations manager · Northwest and Pacific accounts"
        />
      ),
    },
  ];
  return <VariantList variants={variants} />;
  // #endregion demo
}
