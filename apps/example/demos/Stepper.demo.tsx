import React, { useState } from 'react';
import { View } from 'react-native';
import { Caption, Stepper, useTheme } from 'orn-ui';
import { VariantList, type VariantDef } from '@/components/VariantList';

// Stepper is controlled: it cleans what is typed and disables the button that
// would leave the range; the arithmetic lives in your onIncrement/onDecrement.
function StepperExample() {
  const [qty, setQty] = useState('1');
  return (
    <Stepper
      value={qty}
      onChangeText={setQty}
      onIncrement={() => setQty(String(Number(qty || 0) + 1))}
      onDecrement={() => setQty(String(Number(qty || 0) - 1))}
    />
  );
}

function SmallStepperExample() {
  const [qty, setQty] = useState('1');
  return (
    <Stepper
      value={qty}
      onChangeText={setQty}
      onIncrement={() => setQty(String(Number(qty || 0) + 1))}
      onDecrement={() => setQty(String(Number(qty || 0) - 1))}
      size="sm"
    />
  );
}

function LargeStepperExample() {
  const [qty, setQty] = useState('1');
  return (
    <Stepper
      value={qty}
      onChangeText={setQty}
      onIncrement={() => setQty(String(Number(qty || 0) + 1))}
      onDecrement={() => setQty(String(Number(qty || 0) - 1))}
      size="lg"
    />
  );
}

function BlockStepperExample() {
  const [qty, setQty] = useState('1');
  return (
    <Stepper
      value={qty}
      onChangeText={setQty}
      onIncrement={() => setQty(String(Number(qty || 0) + 1))}
      onDecrement={() => setQty(String(Number(qty || 0) - 1))}
      block
    />
  );
}

function ButtonsOnlyExample() {
  const theme = useTheme();
  const [qty, setQty] = useState('1');
  return (
    <View style={{ gap: theme.tokens.spacing.md }}>
      <Stepper
        value={qty}
        onChangeText={setQty}
        onIncrement={() => setQty(String(Number(qty || 0) + 1))}
        onDecrement={() => setQty(String(Number(qty || 0) - 1))}
        editable={false}
      />
      <Caption>No tint: the value changes only with the buttons, and the keyboard never opens.</Caption>
    </View>
  );
}

function RangeExample() {
  const theme = useTheme();
  const [qty, setQty] = useState('5');
  return (
    <View style={{ gap: theme.tokens.spacing.md }}>
      <Stepper
        value={qty}
        onChangeText={setQty}
        onIncrement={() => setQty(String(Number(qty || 0) + 1))}
        onDecrement={() => setQty(String(Number(qty || 0) - 1))}
        min={1}
        max={10}
      />
      <Caption>Range 1–10. Typing 99 and leaving the field clamps it back to 10.</Caption>
    </View>
  );
}

function DecimalsExample() {
  const theme = useTheme();
  const [qty, setQty] = useState('12.50');
  return (
    <View style={{ gap: theme.tokens.spacing.md }}>
      <Stepper
        value={qty}
        onChangeText={setQty}
        onIncrement={() => setQty(String(Number(qty || 0) + 0.5))}
        onDecrement={() => setQty(String(Number(qty || 0) - 0.5))}
        allowDecimals
        min={0}
      />
      <Caption>Without it, digits only: letters, separators and the minus sign never reach the value.</Caption>
    </View>
  );
}

export function StepperDemo() {
  // #region demo
  const variants: VariantDef[] = [
    { label: 'size="md" (default)', content: <StepperExample /> },
    { label: 'size="sm"', content: <SmallStepperExample /> },
    { label: 'size="lg"', content: <LargeStepperExample /> },
    { label: 'block — fills the row, the input takes the rest', content: <BlockStepperExample /> },
    { label: 'editable={false} — buttons only, no keyboard', content: <ButtonsOnlyExample /> },
    { label: 'min / max — the button that would leave the range is disabled', content: <RangeExample /> },
    { label: 'allowDecimals — comma becomes dot', content: <DecimalsExample /> },
  ];
  return <VariantList variants={variants} />;
  // #endregion demo
}
