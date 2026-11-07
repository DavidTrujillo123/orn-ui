import React from 'react';
import { View } from 'react-native';
import { Badge, useColors } from 'orn-ui';
import { VariantList, type VariantDef } from '@/components/VariantList';

function CustomColorsExample() {
  const colors = useColors();
  return <Badge label="VIP" backgroundColor={colors.primarySoft} textColor={colors.primaryText} />;
}

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
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, alignItems: 'flex-start' }}>
          <Badge label="PAID" variant="success" />
          <Badge label="OVERDUE" variant="error" />
          <Badge label="PENDING" variant="warning" />
          <Badge label="DRAFT" variant="info" />
          <Badge label="ARCHIVED" variant="neutral" />
        </View>
      ),
    },
    { label: 'custom colors', content: <CustomColorsExample /> },
  ];
  return <VariantList variants={variants} />;
  // #endregion demo
}
