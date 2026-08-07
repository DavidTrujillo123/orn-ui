import React from 'react';
import { View } from 'react-native';
import { KeyValueRow, Badge } from 'orn-ui';
import { VariantList, type VariantDef } from '@/components/VariantList';

export function KeyValueRowDemo() {
  // #region demo
  const variants: VariantDef[] = [
    {
      label: 'Totals',
      content: (
        <View style={{ gap: 8 }}>
          <KeyValueRow label="Subtotal" value="$300.00" />
          <KeyValueRow label="Tax" value="$40.00" />
          <KeyValueRow label="Total" value="$340.00" labelStyle={{ fontWeight: '700' }} valueStyle={{ fontWeight: '700' }} />
        </View>
      ),
    },
    { label: 'Numeric value', content: <KeyValueRow label="Items" value={12} /> },
    { label: 'Custom node', content: <KeyValueRow label="Status" value={<Badge label="PAID" variant="success" />} /> },
  ];
  return <VariantList variants={variants} />;
  // #endregion demo
}
