import React from 'react';
import { IconButton, useColors } from 'orn-ui';
import { VariantList, type VariantDef } from '@/components/VariantList';

export function IconButtonDemo() {
  // #region demo
  const colors = useColors();
  const variants: VariantDef[] = [
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
