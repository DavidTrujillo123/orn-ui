import React, { useState } from 'react';
import { View } from 'react-native';
import { Body, Card, OptionWheel, Subtitle, type OptionWheelOption } from 'orn-ui';
import { VariantList, type VariantDef } from '@/components/VariantList';

const SIZES: OptionWheelOption<string>[] = [
  { label: 'XS', value: 'xs' },
  { label: 'Small', value: 's' },
  { label: 'Medium', value: 'm' },
  { label: 'Large', value: 'l' },
  { label: 'X-Large', value: 'xl' },
  { label: 'XXL', value: 'xxl' },
];

// Ninguna etiqueta es parte de otra a propósito: el flow de Maestro afirma
// que la rueda nunca se queda en una deshabilitada con assertNotVisible, y con
// 'Large'/'X-Large' ese assert da un falso negativo porque el selector
// encuentra la una adentro de la otra.
const STOCK: OptionWheelOption<string>[] = [
  { label: 'Tiny', value: 'xs' },
  { label: 'Small', value: 's', disabled: true },
  { label: 'Medium', value: 'm' },
  { label: 'Wide', value: 'l', disabled: true },
  { label: 'Huge', value: 'xl' },
];

const MINUTES: OptionWheelOption<number>[] = Array.from({ length: 12 }, (_, i) => ({
  label: String(i * 5).padStart(2, '0'),
  value: i * 5,
}));

function SizeWheel({
  label,
  options,
  testID,
}: {
  label: string;
  options: OptionWheelOption<string>[];
  testID: string;
}) {
  const [size, setSize] = useState('m');
  const current = options.find((option) => option.value === size);

  return (
    <View style={{ gap: 8 }}>
      <OptionWheel label={label} options={options} selectedValue={size} onSelect={setSize} testID={testID} />
      <Body>Picked: {current?.label ?? '—'}</Body>
    </View>
  );
}

function MinuteWheel() {
  const [minutes, setMinutes] = useState(15);

  return (
    <View style={{ gap: 8 }}>
      <OptionWheel
        label="Remind me in"
        options={MINUTES}
        selectedValue={minutes}
        onSelect={setMinutes}
        unit="min"
        visibleCount={3}
      />
      <Body>Reminder in {minutes} minutes</Body>
    </View>
  );
}

function FlatWheel() {
  const [size, setSize] = useState('l');

  return (
    <OptionWheel
      label="No tilt"
      options={SIZES}
      selectedValue={size}
      onSelect={setSize}
      perspective={false}
    />
  );
}

function InCard() {
  const [size, setSize] = useState('s');

  return (
    <Card>
      <Subtitle>Bag size</Subtitle>
      <Body style={{ marginTop: 4, marginBottom: 12 }}>Ships free over 2 kg</Body>
      <OptionWheel
        accessibilityLabel="Bag size"
        options={SIZES}
        selectedValue={size}
        onSelect={setSize}
        visibleCount={3}
      />
    </Card>
  );
}

export function OptionWheelDemo() {
  // #region demo
  const variants: VariantDef[] = [
    {
      label: 'default — five rows, the centre one is the pick',
      content: <SizeWheel label="Size" options={SIZES} testID="wheel-size" />,
    },
    {
      label: 'disabled options — the wheel slides off them on its own',
      content: <SizeWheel label="In stock" options={STOCK} testID="wheel-stock" />,
    },
    {
      label: 'unit and visibleCount={3} — a compact wheel',
      content: <MinuteWheel />,
    },
    {
      label: 'perspective={false} — size and fade, no tilt',
      content: <FlatWheel />,
    },
    {
      label: 'disabled — the whole wheel is frozen',
      content: <OptionWheel label="Locked" options={SIZES} selectedValue="m" onSelect={() => {}} disabled />,
    },
    {
      label: 'inside a Card, named for screen readers',
      content: <InCard />,
    },
  ];
  return <VariantList variants={variants} />;
  // #endregion demo
}
