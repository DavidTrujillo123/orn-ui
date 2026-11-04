import React, { useState } from 'react';
import { View } from 'react-native';
import { Body, SegmentedControl, useTheme, type SegmentedControlOption } from 'orn-ui';
import { VariantList, type VariantDef } from '@/components/VariantList';

const RANGES = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
];

const SORTS = [
  { value: 'recent', label: 'Most recent' },
  { value: 'popular', label: 'Most popular' },
  { value: 'rated', label: 'Highest rated' },
];

// Holds the selected value: SegmentedControl is controlled.
function Segmented({
  options,
  initial,
  disabled,
}: {
  options: SegmentedControlOption[];
  initial: string;
  disabled?: boolean;
}) {
  const [value, setValue] = useState(initial);
  return <SegmentedControl options={options} value={value} onChange={setValue} disabled={disabled} />;
}

// The control and the content it filters, one spacing token apart.
function RangePicker() {
  const theme = useTheme();
  const [range, setRange] = useState('week');
  return (
    <View style={{ gap: theme.tokens.spacing.md }}>
      <SegmentedControl options={RANGES} value={range} onChange={setRange} />
      <Body>Showing the last {range}.</Body>
    </View>
  );
}

export function SegmentedControlDemo() {
  // #region demo
  const variants: VariantDef[] = [
    { label: 'three options', content: <RangePicker /> },
    {
      label: 'two options',
      content: (
        <Segmented
          options={[
            { value: 'left', label: 'Left' },
            { value: 'right', label: 'Right' },
          ]}
          initial="left"
        />
      ),
    },
    { label: 'long labels — one line each', content: <Segmented options={SORTS} initial="recent" /> },
    {
      label: 'one option disabled',
      content: (
        <Segmented options={[...RANGES.slice(0, 2), { value: 'month', label: 'Month', disabled: true }]} initial="week" />
      ),
    },
    { label: 'disabled', content: <Segmented options={RANGES} initial="week" disabled /> },
  ];
  return <VariantList variants={variants} />;
  // #endregion demo
}
