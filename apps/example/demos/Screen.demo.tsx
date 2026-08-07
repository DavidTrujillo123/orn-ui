import React from 'react';
import { View } from 'react-native';
import { Screen, Body } from 'orn-ui';
import { VariantList, type VariantDef } from '@/components/VariantList';

export function ScreenDemo() {
  // #region demo
  const variants: VariantDef[] = [
    {
      label: 'Scrollable (default)',
      content: (
        <View style={{ height: 120, borderRadius: 12, overflow: 'hidden' }}>
          <Screen edges={['top']}>
            <Body>Content laid out inside the screen container.</Body>
          </Screen>
        </View>
      ),
    },
    {
      label: 'scrollable={false}',
      content: (
        <View style={{ height: 80, borderRadius: 12, overflow: 'hidden' }}>
          <Screen scrollable={false} edges={[]}>
            <Body>Non-scrolling, no safe-area insets applied.</Body>
          </Screen>
        </View>
      ),
    },
  ];
  return <VariantList variants={variants} />;
  // #endregion demo
}
