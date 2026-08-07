import React from 'react';
import { Badge } from 'orn-ui';
import { VariantList, VariantRow, type VariantDef } from '@/components/VariantList';

export function BadgeDemo() {
  // #region demo
  const variants: VariantDef[] = [
    { label: 'success', content: <Badge label="PAID" variant="success" /> },
    { label: 'error', content: <Badge label="OVERDUE" variant="error" /> },
    { label: 'warning', content: <Badge label="PENDING" variant="warning" /> },
    { label: 'info', content: <Badge label="DRAFT" variant="info" /> },
    { label: 'neutral', content: <Badge label="ARCHIVED" variant="neutral" /> },
    {
      label: 'all together',
      content: (
        <VariantRow>
          <Badge label="PAID" variant="success" />
          <Badge label="OVERDUE" variant="error" />
          <Badge label="PENDING" variant="warning" />
          <Badge label="DRAFT" variant="info" />
          <Badge label="ARCHIVED" variant="neutral" />
        </VariantRow>
      ),
    },
    { label: 'custom colors', content: <Badge label="VIP" backgroundColor="#7c3aed20" textColor="#7c3aed" /> },
  ];
  return <VariantList variants={variants} />;
  // #endregion demo
}
