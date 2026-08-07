import React, { useState } from 'react';
import { Select } from 'orn-ui';
import { VariantList, type VariantDef } from '@/components/VariantList';

const OPTIONS = [
  { label: 'Cash', value: 'cash' },
  { label: 'Card', value: 'card' },
  { label: 'Transfer', value: 'transfer' },
];

export function SelectDemo() {
  const [value, setValue] = useState<string | undefined>();
  const [required, setRequired] = useState<string | undefined>();
  // #region demo
  const variants: VariantDef[] = [
    { label: 'Default', content: <Select label="Payment method" options={OPTIONS} selectedValue={value} onSelect={setValue} /> },
    {
      label: 'Required',
      content: <Select label="Payment method" required options={OPTIONS} selectedValue={required} onSelect={setRequired} />,
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
