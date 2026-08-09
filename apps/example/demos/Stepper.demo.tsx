import React, { useState } from 'react';
import { View } from 'react-native';
import { Caption, Stepper } from 'orn-ui';
import { VariantList, type VariantDef } from '@/components/VariantList';

export function StepperDemo() {
  const [qty, setQty] = useState('1');
  const [bounded, setBounded] = useState('5');
  const [price, setPrice] = useState('12.50');

  const bind = (value: string, setValue: (next: string) => void, step = 1) => ({
    value,
    onChangeText: setValue,
    onIncrement: () => setValue(String(Number(value || 0) + step)),
    onDecrement: () => setValue(String(Number(value || 0) - step)),
  });

  // #region demo
  const variants: VariantDef[] = [
    { label: 'size="md" (default)', content: <Stepper {...bind(qty, setQty)} /> },
    { label: 'size="sm"', content: <Stepper size="sm" {...bind(qty, setQty)} /> },
    { label: 'size="lg"', content: <Stepper size="lg" {...bind(qty, setQty)} /> },
    {
      label: 'the three sizes together',
      content: (
        <View style={{ gap: 12 }}>
          <Stepper size="sm" {...bind(qty, setQty)} />
          <Stepper size="md" {...bind(qty, setQty)} />
          <Stepper size="lg" {...bind(qty, setQty)} />
        </View>
      ),
    },
    { label: 'block — fills the row, the input takes the rest', content: <Stepper block {...bind(qty, setQty)} /> },
    {
      label: 'editable={false} — buttons only, no keyboard',
      content: (
        <View style={{ gap: 12 }}>
          <Stepper editable={false} {...bind(qty, setQty)} />
          <Caption>The tinted field is the only hint that a value can be typed.</Caption>
        </View>
      ),
    },
    {
      label: 'min / max — the button that would leave the range is disabled',
      content: (
        <View style={{ gap: 12 }}>
          <Stepper min={1} max={10} {...bind(bounded, setBounded)} />
          <Caption>Range 1–10. Typing 99 and leaving the field clamps it back to 10.</Caption>
        </View>
      ),
    },
    {
      label: 'allowDecimals — comma becomes dot',
      content: (
        <View style={{ gap: 12 }}>
          <Stepper allowDecimals min={0} {...bind(price, setPrice, 0.5)} />
          <Caption>Without it, digits only: letters, separators and the minus sign never reach the value.</Caption>
        </View>
      ),
    },
  ];
  return <VariantList variants={variants} />;
  // #endregion demo
}
