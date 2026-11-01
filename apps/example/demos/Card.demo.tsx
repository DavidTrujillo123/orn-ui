import React from 'react';
import { View } from 'react-native';
import { Card, Title, Body, Badge, KeyValueRow, useColors } from 'orn-ui';
import { VariantList, type VariantDef } from '@/components/VariantList';

export function CardDemo() {
  // #region demo
  const colors = useColors();
  const variants: VariantDef[] = [
    {
      label: 'Default',
      content: (
        <Card>
          <Title>Invoice #1042</Title>
          <Body>Due in 5 days · $340.00</Body>
        </Card>
      ),
    },
    {
      label: 'Composed',
      content: (
        <Card>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <Title>Invoice #1043</Title>
            <Badge label="PAID" variant="success" />
          </View>
          <KeyValueRow label="Total" value="$1,240.00" />
        </Card>
      ),
    },
    {
      label: 'Custom style',
      content: (
        <Card style={{ backgroundColor: colors.primary, borderColor: colors.primary, borderRadius: 24 }}>
          <Title color={colors.onPrimary}>Highlighted card</Title>
        </Card>
      ),
    },
  ];
  return <VariantList variants={variants} />;
  // #endregion demo
}
