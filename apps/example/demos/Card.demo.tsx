import React from 'react';
import { View } from 'react-native';
import { Card, Title, Body, Badge, KeyValueRow } from 'orn-ui';
import { VariantList, type VariantDef } from '@/components/VariantList';

export function CardDemo() {
  // #region demo
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
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
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
        <Card style={{ backgroundColor: '#004cef', borderRadius: 24 }}>
          <Title style={{ color: '#fff' }}>Highlighted card</Title>
        </Card>
      ),
    },
  ];
  return <VariantList variants={variants} />;
  // #endregion demo
}
