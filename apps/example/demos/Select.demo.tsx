import React, { useState } from 'react';
import { Card, Select } from 'orn-ui';
import { VariantList, type VariantDef } from '@/components/VariantList';

const OPTIONS = [
  { label: 'Cash', value: 'cash' },
  { label: 'Card', value: 'card' },
  { label: 'Transfer', value: 'transfer' },
];

const WITH_EMOJI = [
  { label: 'Cash', value: 'cash', emoji: '💵' },
  { label: 'Card', value: 'card', emoji: '💳' },
  { label: 'Transfer', value: 'transfer', emoji: '🏦' },
  { label: 'Crypto', value: 'crypto', emoji: '🪙', disabled: true },
];

const COUNTRIES = [
  'Argentina', 'Brazil', 'Canada', 'Chile', 'Colombia', 'Denmark', 'Ecuador', 'France', 'Germany', 'India',
  'Italy', 'Japan', 'Mexico', 'Norway', 'Peru', 'Portugal', 'Spain', 'Sweden', 'Uruguay', 'Vietnam',
].map((label) => ({ label, value: label.toLowerCase() }));

const WITH_ICONS = [
  { label: 'Approved', value: 'approved', iconName: 'check' as const },
  { label: 'Pending', value: 'pending', iconName: 'info' as const },
  { label: 'Rejected', value: 'rejected', iconName: 'close' as const },
];

export function SelectDemo() {
  const [value, setValue] = useState<string | undefined>();
  const [required, setRequired] = useState<string | undefined>();
  const [emoji, setEmoji] = useState<string | undefined>('card');
  const [status, setStatus] = useState<string | undefined>('approved');
  const [country, setCountry] = useState<string | undefined>();
  // #region demo
  const variants: VariantDef[] = [
    { label: 'Default', content: <Select label="Payment method" options={OPTIONS} selectedValue={value} onSelect={setValue} /> },
    {
      label: 'Required',
      content: <Select label="Payment method" required options={OPTIONS} selectedValue={required} onSelect={setRequired} />,
    },
    {
      label: 'Options with emoji (one disabled)',
      content: <Select label="Payment method" options={WITH_EMOJI} selectedValue={emoji} onSelect={setEmoji} />,
    },
    {
      label: 'Options with icons from the theme set',
      content: <Select label="Status" options={WITH_ICONS} selectedValue={status} onSelect={setStatus} />,
    },
    {
      label: 'searchable — 20 options, scrolls and filters',
      content: (
        <Select label="Country" searchable options={COUNTRIES} selectedValue={country} onSelect={setCountry} />
      ),
    },
    {
      label: 'Inside a Card — the list is no longer clipped',
      content: (
        <Card>
          <Select label="Payment method" options={WITH_EMOJI} selectedValue={emoji} onSelect={setEmoji} />
        </Card>
      ),
    },
    {
      label: 'Disabled',
      content: <Select label="Payment method" disabled options={OPTIONS} selectedValue="cash" onSelect={() => {}} />,
    },
    {
      label: 'Error',
      content: <Select label="Payment method" options={OPTIONS} selectedValue={undefined} onSelect={() => {}} error="Required" />,
    },
    {
      label: 'Loading',
      content: <Select label="Payment method" options={OPTIONS} selectedValue={undefined} onSelect={() => {}} isLoading />,
    },
  ];
  return <VariantList variants={variants} />;
  // #endregion demo
}
