import React, { useState } from 'react';
import { View } from 'react-native';
import { Steps, Button } from 'orn-ui';
import { VariantList, type VariantDef } from '@/components/VariantList';

const STEPS = [
  { label: 'Account', description: 'Your details' },
  { label: 'Payment', description: 'Card or cash' },
  { label: 'Confirm' },
];

export function StepsDemo() {
  const [current, setCurrent] = useState(1);
  // #region demo
  const variants: VariantDef[] = [
    {
      label: 'horizontal + check (defaults)',
      content: <Steps steps={STEPS} current={1} />,
    },
    {
      label: 'horizontal + number on completed',
      content: <Steps steps={STEPS} current={2} completedIndicator="number" />,
    },
    {
      label: 'vertical + check',
      content: <Steps steps={STEPS} current={1} orientation="vertical" />,
    },
    {
      label: 'vertical + number',
      content: <Steps steps={STEPS} current={2} orientation="vertical" completedIndicator="number" />,
    },
    {
      label: 'first step (nothing completed yet)',
      content: <Steps steps={STEPS} current={0} />,
    },
    {
      label: 'all completed',
      content: <Steps steps={STEPS} current={3} />,
    },
    {
      label: 'interactive — onStepPress',
      content: (
        <View style={{ gap: 16 }}>
          <Steps steps={STEPS} current={current} onStepPress={setCurrent} />
          <Button
            title="Advance"
            variant="outline"
            onPress={() => setCurrent((c) => Math.min(c + 1, STEPS.length))}
          />
        </View>
      ),
    },
  ];
  return <VariantList variants={variants} />;
  // #endregion demo
}
