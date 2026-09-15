import React, { useState } from 'react';
import { View } from 'react-native';
import { Body, Card, OptionWheel, Subtitle, useColors, type OptionWheelOption } from 'orn-ui';
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

const PORTFOLIO: OptionWheelOption<string>[] = [
  { label: 'Cash', value: 'cash' },
  { label: 'Bonds', value: 'bonds' },
  { label: 'Stocks', value: 'stocks' },
  { label: 'Index funds', value: 'index' },
  { label: 'Real estate', value: 'estate' },
  { label: 'Crypto', value: 'crypto' },
  { label: 'Pension', value: 'pension' },
];

/** Lado del disco: cinco filas de 52 entran justas y el círculo queda parejo. */
const DISC = 5 * 52;

/**
 * 'spotlight' no pinta banda ni fondo: lo único que dice cuál está elegida es
 * que es la nítida y la de más contraste. La superficie de abajo —color y
 * forma— la pone quien compone la rueda, que es lo que hace este demo: un
 * disco con un color del tema, y `textColor` para que las filas contrasten
 * contra él. El componente no elige ningún color acá.
 */
function PortfolioWheel() {
  const [bucket, setBucket] = useState('stocks');
  const colors = useColors();
  const current = PORTFOLIO.find((option) => option.value === bucket);

  return (
    <View style={{ gap: 8, alignItems: 'center' }}>
      <View
        style={{
          width: DISC,
          height: DISC,
          borderRadius: DISC / 2,
          backgroundColor: colors.primaryText,
          overflow: 'hidden',
          justifyContent: 'center',
        }}
      >
        <OptionWheel
          accessibilityLabel="Portfolio bucket"
          options={PORTFOLIO}
          selectedValue={bucket}
          onSelect={setBucket}
          variant="spotlight"
          textColor={colors.onPrimary}
          visibleCount={5}
          itemHeight={52}
          testID="wheel-bucket"
        />
      </View>
      <Body>Allocating to: {current?.label ?? '—'}</Body>
    </View>
  );
}

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
        testID="wheel-minutes"
      />
      <Body>Reminder in {minutes} minutes</Body>
    </View>
  );
}

function FlatWheel() {
  const [size, setSize] = useState('l');
  const current = SIZES.find((option) => option.value === size);

  return (
    <View style={{ gap: 8 }}>
      <OptionWheel
        label="No tilt"
        options={SIZES}
        selectedValue={size}
        onSelect={setSize}
        perspective={false}
        testID="wheel-flat"
      />
      <Body>Flat pick: {current?.label ?? '—'}</Body>
    </View>
  );
}

function LockedWheel() {
  const [size, setSize] = useState('m');
  const current = SIZES.find((option) => option.value === size);

  return (
    <View style={{ gap: 8 }}>
      <OptionWheel
        label="Locked"
        options={SIZES}
        selectedValue={size}
        onSelect={setSize}
        disabled
        testID="wheel-locked"
      />
      <Body>Locked on: {current?.label ?? '—'}</Body>
    </View>
  );
}

function InCard() {
  const [size, setSize] = useState('s');
  const current = SIZES.find((option) => option.value === size);

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
        testID="wheel-bag"
      />
      <Body style={{ marginTop: 8 }}>Bag: {current?.label ?? '—'}</Body>
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
      content: <LockedWheel />,
    },
    {
      label: 'inside a Card, named for screen readers',
      content: <InCard />,
    },
    {
      label: "variant='spotlight' — no band, the sharp row is the pick",
      content: <PortfolioWheel />,
    },
  ];
  return <VariantList variants={variants} />;
  // #endregion demo
}
