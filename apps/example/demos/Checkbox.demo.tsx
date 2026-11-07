import React, { useState } from 'react';
import { Checkbox, useColors } from 'orn-ui';
import { VariantList, type VariantDef } from '@/components/VariantList';

function AcceptTermsExample() {
  const [checked, setChecked] = useState(false);
  return <Checkbox value={checked} onValueChange={setChecked} label="Accept terms" />;
}

function CustomColorExample() {
  const colors = useColors();
  return <Checkbox value={true} onValueChange={() => {}} label="Custom color" color={colors.secondary} />;
}

export function CheckboxDemo() {
  // #region demo
  const variants: VariantDef[] = [
    { label: 'Interactive', content: <AcceptTermsExample /> },
    { label: 'Checked', content: <Checkbox value={true} onValueChange={() => {}} label="Subscribed to updates" /> },
    { label: 'Disabled', content: <Checkbox value={true} onValueChange={() => {}} label="Always checked" disabled /> },
    { label: 'Custom color', content: <CustomColorExample /> },
  ];
  return <VariantList variants={variants} />;
  // #endregion demo
}
