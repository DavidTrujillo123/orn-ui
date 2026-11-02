import React from 'react';
import { View } from 'react-native';
import { Fab, useColors } from 'orn-ui';
import { VariantList, type VariantDef } from '@/components/VariantList';

function CustomColor() {
  const colors = useColors();
  return (
    // Fab is absolute: here it anchors to a 96pt box. In a real screen it sits
    // at screen level, with no bottom/right/safeArea.
    <View style={{ height: 96 }}>
      <Fab
        onPress={() => {}}
        accessibilityLabel="Add expense"
        color={colors.warning}
        safeArea={false}
        bottom={0}
        right={0}
      />
    </View>
  );
}

export function FabDemo() {
  // #region demo
  const variants: VariantDef[] = [
    {
      label: 'default — primary fill, plus icon',
      content: (
        <View style={{ height: 96 }}>
          <Fab onPress={() => {}} accessibilityLabel="Create invoice" safeArea={false} bottom={0} right={0} />
        </View>
      ),
    },
    { label: 'color — the icon picks black or white for contrast', content: <CustomColor /> },
    {
      label: 'size and iconName',
      content: (
        <View style={{ height: 96 }}>
          <Fab onPress={() => {}} accessibilityLabel="Search" iconName="search" size={48} safeArea={false} bottom={0} right={0} />
        </View>
      ),
    },
  ];
  return <VariantList variants={variants} />;
  // #endregion demo
}
