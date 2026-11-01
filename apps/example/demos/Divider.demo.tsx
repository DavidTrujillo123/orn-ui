import React from 'react';
import { View } from 'react-native';
import { Divider, Body, useColors } from 'orn-ui';
import { VariantList, type VariantDef } from '@/components/VariantList';

export function DividerDemo() {
  // #region demo
  const colors = useColors();
  const variants: VariantDef[] = [
    {
      label: 'Default',
      content: (
        <View>
          <Body>Above</Body>
          <Divider spacing="md" />
          <Body>Below</Body>
        </View>
      ),
    },
    {
      label: 'Vertical',
      content: (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
          <Body>Edit</Body>
          <Divider orientation="vertical" spacing="md" />
          <Body>Share</Body>
          <Divider orientation="vertical" spacing="md" />
          <Body>Delete</Body>
        </View>
      ),
    },
    { label: 'Custom style', content: <Divider style={{ height: 2, backgroundColor: colors.primary }} /> },
  ];
  return <VariantList variants={variants} />;
  // #endregion demo
}
