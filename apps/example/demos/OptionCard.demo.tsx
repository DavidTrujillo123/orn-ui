import React, { useState } from 'react';
import { View } from 'react-native';
import { OptionCard, useTheme } from 'orn-ui';
import { VariantList, type VariantDef } from '@/components/VariantList';

const PLANS = [
  { value: 'basic', label: 'Basic', iconName: 'user' },
  { value: 'plus', label: 'Plus', iconName: 'star' },
  { value: 'family', label: 'Family', iconName: 'heart' },
] as const;

const SHIPPING = [
  { value: 'standard', label: 'Standard', description: 'Arrives in 3 days' },
  { value: 'express', label: 'Express', description: 'Tomorrow, $8 more' },
] as const;

// One question, one row: the screen reader announces the group as a radio group ("1 of 3").
function OptionRow({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: theme.tokens.spacing.sm }} accessibilityRole="radiogroup">
      {children}
    </View>
  );
}

export function OptionCardDemo() {
  const [plan, setPlan] = useState<string>('basic');
  const [shipping, setShipping] = useState<string>('standard');

  // #region demo
  const variants: VariantDef[] = [
    {
      label: 'layout="horizontal" — two options',
      content: (
        <OptionRow>
          {PLANS.slice(0, 2).map((option) => (
            <OptionCard
              key={option.value}
              label={option.label}
              iconName={option.iconName}
              isSelected={plan === option.value}
              onPress={() => setPlan(option.value)}
            />
          ))}
        </OptionRow>
      ),
    },
    {
      label: 'layout="vertical" — three options',
      content: (
        <OptionRow>
          {PLANS.map((option) => (
            <OptionCard
              key={option.value}
              layout="vertical"
              label={option.label}
              iconName={option.iconName}
              isSelected={plan === option.value}
              onPress={() => setPlan(option.value)}
            />
          ))}
        </OptionRow>
      ),
    },
    {
      label: 'with description, no icon',
      content: (
        <OptionRow>
          {SHIPPING.map((option) => (
            <OptionCard
              key={option.value}
              layout="vertical"
              label={option.label}
              description={option.description}
              isSelected={shipping === option.value}
              onPress={() => setShipping(option.value)}
            />
          ))}
        </OptionRow>
      ),
    },
    {
      label: 'disabled option',
      content: (
        <OptionRow>
          <OptionCard label="Basic" iconName="user" isSelected onPress={() => {}} />
          <OptionCard label="Plus" iconName="star" isSelected={false} disabled onPress={() => {}} />
        </OptionRow>
      ),
    },
  ];
  return <VariantList variants={variants} />;
  // #endregion demo
}
