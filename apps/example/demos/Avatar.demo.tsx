import React from 'react';
import { View } from 'react-native';
import { Avatar, useColors } from 'orn-ui';
import { VariantList, type VariantDef } from '@/components/VariantList';

function SoftColorsExample() {
  const colors = useColors();
  return <Avatar iconName="star" backgroundColor={colors.secondarySoft} color={colors.secondaryText} />;
}

export function AvatarDemo() {
  // #region demo
  const variants: VariantDef[] = [
    { label: 'Initials from name', content: <Avatar name="Ada Lovelace" /> },
    { label: 'Photo', content: <Avatar name="Ada Lovelace" source={{ uri: 'https://picsum.photos/id/64/200' }} /> },
    { label: 'Broken photo falls back to initials', content: <Avatar name="Grace Hopper" source={{ uri: 'https://invalid.example/x.png' }} /> },
    { label: 'Icon (no name)', content: <Avatar /> },
    {
      label: 'Sizes',
      content: (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
          <Avatar name="Small Size" size={28} />
          <Avatar name="Medium Size" size={44} />
          <Avatar name="Large Size" size={64} />
        </View>
      ),
    },
    {
      label: 'Custom color',
      content: <SoftColorsExample />,
    },
  ];
  return <VariantList variants={variants} />;
  // #endregion demo
}
