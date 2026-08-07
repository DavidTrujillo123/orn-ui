import React from 'react';
import { View } from 'react-native';
import { Divider, Body } from 'orn-ui';
import { VariantList, type VariantDef } from '@/components/VariantList';

export function DividerDemo() {
  // #region demo
  const variants: VariantDef[] = [
    {
      label: 'Default',
      content: (
        <View>
          <Body>Above</Body>
          <Divider style={{ marginVertical: 12 }} />
          <Body>Below</Body>
        </View>
      ),
    },
    { label: 'Custom style', content: <Divider style={{ height: 2, backgroundColor: '#004cef' }} /> },
  ];
  return <VariantList variants={variants} />;
  // #endregion demo
}
