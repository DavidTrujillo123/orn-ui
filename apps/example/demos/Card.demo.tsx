import React from 'react';
import { View } from 'react-native';
import { Card, Title, Body, Badge, KeyValueRow, useColors, useTheme } from 'orn-ui';
import { VariantList, type VariantDef } from '@/components/VariantList';

function ComposedCardExample() {
  const theme = useTheme();
  return (
    <Card>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: theme.tokens.spacing.sm,
        }}
      >
        <Title>Invoice #1043</Title>
        <Badge label="PAID" variant="success" />
      </View>
      <KeyValueRow label="Total" value="$1,240.00" />
    </Card>
  );
}

function HighlightedCardExample() {
  const colors = useColors();
  const theme = useTheme();
  return (
    <Card style={{ backgroundColor: colors.primary, borderColor: colors.primary, borderRadius: theme.tokens.radius.xxl }}>
      <Title color={colors.onPrimary}>Highlighted card</Title>
    </Card>
  );
}

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
    { label: 'Composed', content: <ComposedCardExample /> },
    { label: 'Custom style', content: <HighlightedCardExample /> },
  ];
  return <VariantList variants={variants} />;
  // #endregion demo
}
