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

function PaymentExample() {
  const [method, setMethod] = useState<string | undefined>();
  return <Select label="Payment method" options={OPTIONS} selectedValue={method} onSelect={setMethod} />;
}

function RequiredExample() {
  const [method, setMethod] = useState<string | undefined>();
  return <Select label="Payment method" required options={OPTIONS} selectedValue={method} onSelect={setMethod} />;
}

function EmojiExample() {
  const [method, setMethod] = useState<string | undefined>('card');
  return <Select label="Payment method" options={WITH_EMOJI} selectedValue={method} onSelect={setMethod} />;
}

function IconsExample() {
  const [status, setStatus] = useState<string | undefined>('approved');
  return <Select label="Status" options={WITH_ICONS} selectedValue={status} onSelect={setStatus} />;
}

function SearchableExample() {
  const [country, setCountry] = useState<string | undefined>();
  return <Select label="Country" searchable options={COUNTRIES} selectedValue={country} onSelect={setCountry} />;
}

function InCardExample() {
  const [method, setMethod] = useState<string | undefined>('card');
  return (
    <Card>
      <Select label="Payment method" options={WITH_EMOJI} selectedValue={method} onSelect={setMethod} />
    </Card>
  );
}

export function SelectDemo() {
  // #region demo
  const variants: VariantDef[] = [
    { label: 'Default', content: <PaymentExample /> },
    { label: 'Required', content: <RequiredExample /> },
    { label: 'Options with emoji (one disabled)', content: <EmojiExample /> },
    { label: 'Options with icons from the theme set', content: <IconsExample /> },
    { label: 'searchable — 20 options, scrolls and filters', content: <SearchableExample /> },
    { label: 'Inside a Card — the list is no longer clipped', content: <InCardExample /> },
    {
      label: 'Disabled',
      content: <Select label="Payment method" disabled options={OPTIONS} selectedValue="cash" onSelect={() => {}} />,
    },
    {
      label: 'Error',
      content: (
        <Select label="Payment method" options={OPTIONS} selectedValue={undefined} onSelect={() => {}} error="Pick a payment method" />
      ),
    },
    {
      label: 'Loading',
      content: <Select label="Payment method" options={OPTIONS} selectedValue={undefined} onSelect={() => {}} isLoading />,
    },
  ];
  return <VariantList variants={variants} />;
  // #endregion demo
}
