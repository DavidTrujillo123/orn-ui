import React, { useState } from 'react';
import { View } from 'react-native';
import { Button, Steps, useTheme } from 'orn-ui';
import { VariantList, type VariantDef } from '@/components/VariantList';

const STEPS = [
  { label: 'Account', description: 'Your details' },
  { label: 'Payment', description: 'Card or cash' },
  { label: 'Confirm' },
];

const DELIVERY_STEPS = [
  { label: 'Payment confirmed', description: 'Verified' },
  { label: 'Warehouse', description: 'Packed' },
  { label: 'Out for delivery', description: 'On its way' },
  { label: 'Delivered', description: 'At your door' },
];

function InteractiveStepsExample() {
  const theme = useTheme();
  const [current, setCurrent] = useState(1);
  return (
    <View style={{ gap: theme.tokens.spacing.lg }}>
      <Steps steps={STEPS} current={current} onStepPress={setCurrent} />
      <Button
        title="Next"
        variant="outline"
        onPress={() => setCurrent(Math.min(current + 1, STEPS.length))}
      />
    </View>
  );
}

export function StepsDemo() {
  // #region demo
  const variants: VariantDef[] = [
    { label: 'horizontal + check (defaults)', content: <Steps steps={STEPS} current={1} /> },
    {
      label: 'horizontal + number on completed',
      content: <Steps steps={STEPS} current={2} completedIndicator="number" />,
    },
    { label: 'vertical + check', content: <Steps steps={STEPS} current={1} orientation="vertical" /> },
    {
      label: 'vertical + number',
      content: <Steps steps={STEPS} current={2} orientation="vertical" completedIndicator="number" />,
    },
    { label: 'first step (nothing completed yet)', content: <Steps steps={STEPS} current={0} /> },
    { label: 'all completed', content: <Steps steps={STEPS} current={3} /> },
    {
      label: 'long labels — the row scrolls instead of breaking words',
      content: <Steps steps={DELIVERY_STEPS} current={2} />,
    },
    { label: 'interactive — onStepPress', content: <InteractiveStepsExample /> },
  ];
  return <VariantList variants={variants} />;
  // #endregion demo
}
