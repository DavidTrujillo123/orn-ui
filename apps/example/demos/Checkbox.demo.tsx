import React, { useState } from 'react';
import { Checkbox } from 'orn-ui';
import { VariantList, type VariantDef } from '@/components/VariantList';

export function CheckboxDemo() {
  const [checked, setChecked] = useState(false);
  // #region demo
  const variants: VariantDef[] = [
    { label: 'Interactive', content: <Checkbox value={checked} onValueChange={setChecked} label="Accept terms" /> },
    { label: 'Checked', content: <Checkbox value={true} onValueChange={() => {}} label="Subscribed to updates" /> },
    { label: 'Disabled', content: <Checkbox value={true} onValueChange={() => {}} label="Always checked" disabled /> },
    { label: 'Custom color', content: <Checkbox value={true} onValueChange={() => {}} label="Custom color" color="#00cae1" /> },
  ];
  return <VariantList variants={variants} />;
  // #endregion demo
}
