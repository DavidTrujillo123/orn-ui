import React from 'react';
import { View } from 'react-native';
import { Fab } from 'orn-ui';
import { VariantList, type VariantDef } from '@/components/VariantList';

export function FabDemo() {
  // #region demo
  const variants: VariantDef[] = [
    {
      label: 'Default',
      content: (
        <View style={{ height: 90 }}>
          <Fab onPress={() => {}} accessibilityLabel="Create invoice" bottom={0} right={0} />
        </View>
      ),
    },
    {
      label: 'Custom',
      content: (
        <View style={{ height: 90 }}>
          <Fab onPress={() => {}} accessibilityLabel="Search" iconName="search" color="#00cae1" size={48} bottom={0} right={0} />
        </View>
      ),
    },
  ];
  return <VariantList variants={variants} />;
  // #endregion demo
}
