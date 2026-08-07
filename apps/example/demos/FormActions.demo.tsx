import React from 'react';
import { FormActions } from 'orn-ui';
import { VariantList, type VariantDef } from '@/components/VariantList';

export function FormActionsDemo() {
  // #region demo
  const variants: VariantDef[] = [
    { label: 'Primary + secondary', content: <FormActions primaryLabel="Save" onPrimaryPress={() => {}} onSecondaryPress={() => {}} /> },
    { label: 'Secondary only', content: <FormActions secondaryLabel="Close" onSecondaryPress={() => {}} /> },
    {
      label: 'Primary disabled',
      content: <FormActions primaryLabel="Save" onPrimaryPress={() => {}} primaryDisabled onSecondaryPress={() => {}} />,
    },
    {
      label: 'Primary loading',
      content: <FormActions primaryLabel="Saving..." onPrimaryPress={() => {}} primaryLoading onSecondaryPress={() => {}} />,
    },
  ];
  return <VariantList variants={variants} />;
  // #endregion demo
}
