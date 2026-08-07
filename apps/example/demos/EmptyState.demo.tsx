import React from 'react';
import { EmptyState } from 'orn-ui';
import { VariantList, type VariantDef } from '@/components/VariantList';

export function EmptyStateDemo() {
  // #region demo
  const variants: VariantDef[] = [
    { label: 'Search', content: <EmptyState title="No invoices found" description="Try a different search term" iconName="search" /> },
    { label: 'Custom icon', content: <EmptyState title="No clients yet" description="Add your first client to get started" iconName="info" /> },
  ];
  return <VariantList variants={variants} />;
  // #endregion demo
}
