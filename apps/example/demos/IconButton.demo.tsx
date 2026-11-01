import React from 'react';
import { View } from 'react-native';
import { BUILT_IN_ICON_NAMES, Caption, IconButton, useColors } from 'orn-ui';
import { VariantList, type VariantDef } from '@/components/VariantList';

export function IconButtonDemo() {
  // #region demo
  const colors = useColors();
  const variants: VariantDef[] = [
    {
      label: 'All built-in icons',
      content: (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', rowGap: 12 }}>
          {BUILT_IN_ICON_NAMES.map((name) => (
            <View key={name} style={{ width: '20%', alignItems: 'center' }}>
              <IconButton iconName={name} accessibilityLabel={name} onPress={() => {}} />
              <Caption align="center">
                {name}
              </Caption>
            </View>
          ))}
        </View>
      ),
    },
    { label: 'close', content: <IconButton iconName="close" accessibilityLabel="Close" onPress={() => {}} /> },
    { label: 'check', content: <IconButton iconName="check" accessibilityLabel="Confirm" onPress={() => {}} /> },
    { label: 'search', content: <IconButton iconName="search" accessibilityLabel="Search" onPress={() => {}} /> },
    { label: 'small', content: <IconButton iconName="check" size={16} accessibilityLabel="Small" onPress={() => {}} /> },
    { label: 'large', content: <IconButton iconName="check" size={32} accessibilityLabel="Large" onPress={() => {}} /> },
    { label: 'custom color', content: <IconButton iconName="check" color={colors.error} accessibilityLabel="Red" onPress={() => {}} /> },
    { label: 'disabled', content: <IconButton iconName="close" accessibilityLabel="Disabled" onPress={() => {}} disabled /> },
  ];
  return <VariantList variants={variants} />;
  // #endregion demo
}
