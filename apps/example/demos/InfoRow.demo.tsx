import React from 'react';
import { InfoRow } from 'orn-ui';
import { VariantList, type VariantDef } from '@/components/VariantList';

export function InfoRowDemo() {
  // #region demo
  const variants: VariantDef[] = [
    { label: 'With value', content: <InfoRow icon="info" label="Email" value="jane@example.com" placeholder="No email" /> },
    { label: 'Missing value', content: <InfoRow icon="info" label="Phone" value={undefined} placeholder="No phone number" /> },
    { label: 'Different icon', content: <InfoRow icon="check" label="Status" value="Verified" placeholder="Unverified" /> },
  ];
  return <VariantList variants={variants} />;
  // #endregion demo
}
