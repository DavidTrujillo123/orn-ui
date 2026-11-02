import React from 'react';
import { View } from 'react-native';
import { Badge, Divider, KeyValueRow, useTheme } from 'orn-ui';
import { VariantList, type VariantDef } from '@/components/VariantList';

function Totals() {
  const theme = useTheme();
  const strong = { fontWeight: theme.tokens.fontWeight.bold, fontSize: theme.tokens.fontSize.md };

  return (
    <View style={{ gap: theme.tokens.spacing.sm }}>
      <KeyValueRow label="Subtotal" value="$1,300.00" />
      <KeyValueRow label="Tax (12%)" value="$156.00" />
      <KeyValueRow label="Discount" value="-$40.00" />
      <Divider />
      <KeyValueRow label="Total" value="$1,416.00" labelStyle={strong} valueStyle={strong} />
    </View>
  );
}

export function KeyValueRowDemo() {
  // #region demo
  const variants: VariantDef[] = [
    { label: 'totals — digits line up in the value column', content: <Totals /> },
    { label: 'numeric value', content: <KeyValueRow label="Items" value={12} /> },
    {
      label: 'custom node as value',
      content: <KeyValueRow label="Status" value={<Badge label="PAID" variant="success" />} />,
    },
    {
      label: 'long value — wraps inside its half',
      content: <KeyValueRow label="Billing address" value="1600 Amphitheatre Parkway, Mountain View, CA 94043" />,
    },
  ];
  return <VariantList variants={variants} />;
  // #endregion demo
}
