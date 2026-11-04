import React from 'react';
import { FormActions } from 'orn-ui';
import { VariantList, type VariantDef } from '@/components/VariantList';

export function FormActionsDemo() {
  // #region demo
  const variants: VariantDef[] = [
    {
      label: 'Primary + secondary',
      content: (
        <FormActions primaryLabel="Save" onPrimaryPress={() => {}} secondaryLabel="Cancel" onSecondaryPress={() => {}} />
      ),
    },
    {
      label: 'primaryLeftIconName',
      content: (
        <FormActions
          primaryLabel="Confirm order"
          primaryLeftIconName="check"
          onPrimaryPress={() => {}}
          secondaryLabel="Back"
          onSecondaryPress={() => {}}
        />
      ),
    },
    { label: 'Secondary only — default label', content: <FormActions onSecondaryPress={() => {}} /> },
    {
      label: 'primaryDisabled — invalid form',
      content: (
        <FormActions
          primaryLabel="Save"
          onPrimaryPress={() => {}}
          primaryDisabled
          secondaryLabel="Cancel"
          onSecondaryPress={() => {}}
        />
      ),
    },
    {
      label: 'primaryLoading — cancel still works',
      content: (
        <FormActions
          primaryLabel="Save"
          onPrimaryPress={() => {}}
          primaryLoading
          secondaryLabel="Cancel"
          onSecondaryPress={() => {}}
        />
      ),
    },
  ];
  return <VariantList variants={variants} />;
  // #endregion demo
}
