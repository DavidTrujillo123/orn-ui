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

// No label is part of another on purpose: the Maestro flow asserts the wheel
// never stays on a disabled one with assertNotVisible, and with
// 'Large'/'X-Large' that assert gives a false negative because the selector
// finds one inside the other.
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

const ROW = 52;
const ROWS = 5;
/**
 * Radius of the wheel the rows fall on: with the center outside and to the
 * left, the smaller it is, the tighter the curve. At 0.7 window heights the
 * circumference reads at once, and the outermost row still fits in the box.
 */
const CURVE = ROWS * ROW * 0.7;

/**
 * 'spotlight' paints no band or background: the only thing that says which
 * one is selected is that it's the sharp one with the most contrast. The
 * surface below —color and shape— is provided by whoever composes the wheel,
 * and the rows' color comes in through `textColor`: the component picks no
 * color here.
 *
 * `curveRadius` is what makes it look like a wheel and not a list: the rows
 * fall on the edge of a circle whose center is outside, to the left, so they
 * move inward and tilt with the tangent as they get further from the center.
 * It goes without `perspective`: tilting on two axes at once muddies the arc
 * instead of reinforcing it.
 */
function PortfolioWheel() {
  const [bucket, setBucket] = useState('stocks');
  const colors = useColors();
  const current = PORTFOLIO.find((option) => option.value === bucket);

  return (
    <View style={{ gap: 8 }}>
      <View
        style={{
          backgroundColor: colors.surface,
          borderRadius: 24,
          borderWidth: 1,
          borderColor: colors.border,
          overflow: 'hidden',
          paddingVertical: 12,
        }}
      >
        <OptionWheel
          accessibilityLabel="Portfolio bucket"
          options={PORTFOLIO}
          selectedValue={bucket}
          onSelect={setBucket}
          variant="spotlight"
          textColor={colors.text}
          curveRadius={CURVE}
          perspective={false}
          visibleCount={ROWS}
          itemHeight={ROW}
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
