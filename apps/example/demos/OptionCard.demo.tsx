import React, { useState } from 'react';
import { View } from 'react-native';
import { OptionCard, useTheme } from 'orn-ui';
import { VariantList, type VariantDef } from '@/components/VariantList';

function TwoPlansExample() {
  const theme = useTheme();
  const [plan, setPlan] = useState('basic');
  return (
    // radiogroup: the screen reader announces "1 of 2".
    <View style={{ flexDirection: 'row', gap: theme.tokens.spacing.sm }} accessibilityRole="radiogroup">
      <OptionCard label="Basic" iconName="user" isSelected={plan === 'basic'} onPress={() => setPlan('basic')} />
      <OptionCard label="Plus" iconName="star" isSelected={plan === 'plus'} onPress={() => setPlan('plus')} />
    </View>
  );
}

function ThreePlansExample() {
  const theme = useTheme();
  const [plan, setPlan] = useState('basic');
  return (
    <View style={{ flexDirection: 'row', gap: theme.tokens.spacing.sm }} accessibilityRole="radiogroup">
      <OptionCard
        layout="vertical"
        label="Basic"
        iconName="user"
        isSelected={plan === 'basic'}
        onPress={() => setPlan('basic')}
      />
      <OptionCard
        layout="vertical"
        label="Plus"
        iconName="star"
        isSelected={plan === 'plus'}
        onPress={() => setPlan('plus')}
      />
      <OptionCard
        layout="vertical"
        label="Family"
        iconName="heart"
        isSelected={plan === 'family'}
        onPress={() => setPlan('family')}
      />
    </View>
  );
}

function ShippingExample() {
  const theme = useTheme();
  const [shipping, setShipping] = useState('standard');
  return (
    <View style={{ flexDirection: 'row', gap: theme.tokens.spacing.sm }} accessibilityRole="radiogroup">
      <OptionCard
        layout="vertical"
        label="Standard"
        description="Arrives in 3 days"
        isSelected={shipping === 'standard'}
        onPress={() => setShipping('standard')}
      />
      <OptionCard
        layout="vertical"
        label="Express"
        description="Tomorrow, $8 more"
        isSelected={shipping === 'express'}
        onPress={() => setShipping('express')}
      />
    </View>
  );
}

function DisabledOptionExample() {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: theme.tokens.spacing.sm }} accessibilityRole="radiogroup">
      <OptionCard label="Basic" iconName="user" isSelected onPress={() => {}} />
      <OptionCard label="Plus" iconName="star" isSelected={false} disabled onPress={() => {}} />
    </View>
  );
}

export function OptionCardDemo() {
  // #region demo
  const variants: VariantDef[] = [
    { label: 'layout="horizontal" — two options', content: <TwoPlansExample /> },
    { label: 'layout="vertical" — three options', content: <ThreePlansExample /> },
    { label: 'with description, no icon', content: <ShippingExample /> },
    { label: 'disabled option', content: <DisabledOptionExample /> },
  ];
  return <VariantList variants={variants} />;
  // #endregion demo
}
