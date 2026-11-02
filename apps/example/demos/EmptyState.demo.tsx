import React from 'react';
import { Avatar, EmptyState } from 'orn-ui';
import { VariantList, type VariantDef } from '@/components/VariantList';

export function EmptyStateDemo() {
  // #region demo
  const variants: VariantDef[] = [
    { label: 'default — labels from UIProvider', content: <EmptyState /> },
    {
      label: 'search',
      content: <EmptyState title="No invoices found" description="Try a different search term" iconName="search" />,
    },
    {
      label: 'action — the next step as a button',
      content: (
        <EmptyState
          title="No clients yet"
          description="Add your first client to get started"
          iconName="user"
          action={{ label: 'Add client', onPress: () => {} }}
        />
      ),
    },
    {
      label: 'icon — any node in place of the icon',
      content: (
        <EmptyState
          title="Your team is empty"
          description="Invite people to share invoices and clients"
          icon={<Avatar name="Acme Studio" size={64} />}
        />
      ),
    },
    {
      label: 'long description — wraps centered',
      content: (
        <EmptyState
          title="Nothing scheduled"
          description="Payments you schedule show up here with their due date, amount and the client they belong to."
          iconName="info"
        />
      ),
    },
  ];
  return <VariantList variants={variants} />;
  // #endregion demo
}
