import React, { useState } from 'react';
import { View } from 'react-native';
import { OptionCard } from 'orn-ui';
import { VariantList, type VariantDef } from '@/components/VariantList';

const PAYMENTS = [
  { value: 'cash', label: 'Cash', iconName: 'check' },
  { value: 'card', label: 'Card', iconName: 'info' },
  { value: 'transfer', label: 'Transfer', iconName: 'search' },
] as const;

const SHIPPING = [
  { value: 'standard', label: 'Standard', description: 'Arrives in 3 days' },
  { value: 'express', label: 'Express', description: 'Tomorrow, $8 more' },
] as const;

export function OptionCardDemo() {
  const [payment, setPayment] = useState<string>('cash');
  const [shipping, setShipping] = useState<string>('standard');

  const row = (children: React.ReactNode) => (
    <View style={{ flexDirection: 'row', gap: 8 }} accessibilityRole="radiogroup">
      {children}
    </View>
  );

  // #region demo
  const variants: VariantDef[] = [
    {
      label: 'layout="horizontal" — two options',
      content: row(
        PAYMENTS.slice(0, 2).map((option) => (
          <OptionCard
            key={option.value}
            label={option.label}
            iconName={option.iconName}
            isSelected={payment === option.value}
            onPress={() => setPayment(option.value)}
          />
        ))
      ),
    },
    {
      label: 'layout="vertical" — three options',
      content: row(
        PAYMENTS.map((option) => (
          <OptionCard
            key={option.value}
            layout="vertical"
            label={option.label}
            iconName={option.iconName}
            isSelected={payment === option.value}
            onPress={() => setPayment(option.value)}
          />
        ))
      ),
    },
    {
      label: 'with description, no icon',
      content: row(
        SHIPPING.map((option) => (
          <OptionCard
            key={option.value}
            layout="vertical"
            label={option.label}
            description={option.description}
            isSelected={shipping === option.value}
            onPress={() => setShipping(option.value)}
          />
        ))
      ),
    },
    {
      label: 'disabled option',
      content: row(
        <>
          <OptionCard label="Cash" iconName="check" isSelected onPress={() => {}} />
          <OptionCard label="Card" iconName="info" isSelected={false} disabled onPress={() => {}} />
        </>
      ),
    },
  ];
  return <VariantList variants={variants} />;
  // #endregion demo
}
