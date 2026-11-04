import React, { useState } from 'react';
import { SegmentedControl } from 'orn-ui';
import { VariantList, type VariantDef } from '@/components/VariantList';

const RANGES = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
];

function ThreeOptionsExample() {
  const [range, setRange] = useState('week');
  return <SegmentedControl options={RANGES} value={range} onChange={setRange} />;
}

function TwoOptionsExample() {
  const [side, setSide] = useState('left');
  return (
    <SegmentedControl
      options={[
        { value: 'left', label: 'Left' },
        { value: 'right', label: 'Right' },
      ]}
      value={side}
      onChange={setSide}
    />
  );
}

function LongLabelsExample() {
  const [sort, setSort] = useState('recent');
  return (
    <SegmentedControl
      options={[
        { value: 'recent', label: 'Most recent' },
        { value: 'popular', label: 'Most popular' },
        { value: 'rated', label: 'Highest rated' },
      ]}
      value={sort}
      onChange={setSort}
    />
  );
}

function OneOptionDisabledExample() {
  const [range, setRange] = useState('week');
  return (
    <SegmentedControl
      options={[
        { value: 'day', label: 'Day' },
        { value: 'week', label: 'Week' },
        { value: 'month', label: 'Month', disabled: true },
      ]}
      value={range}
      onChange={setRange}
    />
  );
}

export function SegmentedControlDemo() {
  // #region demo
  const variants: VariantDef[] = [
    { label: 'three options', content: <ThreeOptionsExample /> },
    { label: 'two options', content: <TwoOptionsExample /> },
    { label: 'long labels — one line each', content: <LongLabelsExample /> },
    { label: 'one option disabled', content: <OneOptionDisabledExample /> },
    {
      label: 'disabled',
      content: <SegmentedControl options={RANGES} value="week" onChange={() => {}} disabled />,
    },
  ];
  return <VariantList variants={variants} />;
  // #endregion demo
}
