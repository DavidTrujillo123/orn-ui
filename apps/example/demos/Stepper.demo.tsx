import React, { useState } from 'react';
import { View } from 'react-native';
import { Caption, Stepper, type StepperProps } from 'orn-ui';
import { VariantList, type VariantDef } from '@/components/VariantList';

// A controlled Stepper: the component cleans what is typed and disables the
// button that would leave the range; the arithmetic lives in the caller.
function Quantity({ initial = '1', step = 1, ...props }: Partial<StepperProps> & { initial?: string; step?: number }) {
  const [value, setValue] = useState(initial);
  return (
    <Stepper
      value={value}
      onChangeText={setValue}
      onIncrement={() => setValue(String(Number(value || 0) + step))}
      onDecrement={() => setValue(String(Number(value || 0) - step))}
      {...props}
    />
  );
}

export function StepperDemo() {
  // #region demo
  const variants: VariantDef[] = [
    { label: 'size="md" (default)', content: <Quantity /> },
    { label: 'size="sm"', content: <Quantity size="sm" /> },
    { label: 'size="lg"', content: <Quantity size="lg" /> },
    {
      label: 'the three sizes together',
      content: (
        <View style={{ gap: 12 }}>
          <Quantity size="sm" />
          <Quantity size="md" />
          <Quantity size="lg" />
        </View>
      ),
    },
    { label: 'block — fills the row, the input takes the rest', content: <Quantity block /> },
    {
      label: 'editable={false} — buttons only, no keyboard',
      content: (
        <View style={{ gap: 12 }}>
          <Quantity editable={false} />
          <Caption>No tint: the value changes only with the buttons, and the keyboard never opens.</Caption>
        </View>
      ),
    },
    {
      label: 'min / max — the button that would leave the range is disabled',
      content: (
        <View style={{ gap: 12 }}>
          <Quantity initial="5" min={1} max={10} />
          <Caption>Range 1–10. Typing 99 and leaving the field clamps it back to 10.</Caption>
        </View>
      ),
    },
    {
      label: 'allowDecimals — comma becomes dot',
      content: (
        <View style={{ gap: 12 }}>
          <Quantity initial="12.50" step={0.5} allowDecimals min={0} />
          <Caption>Without it, digits only: letters, separators and the minus sign never reach the value.</Caption>
        </View>
      ),
    },
  ];
  return <VariantList variants={variants} />;
  // #endregion demo
}
