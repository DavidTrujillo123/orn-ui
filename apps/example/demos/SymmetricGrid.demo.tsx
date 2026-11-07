import React from 'react';
import { Body, Card, SymmetricGrid } from 'orn-ui';
import { VariantList, type VariantDef } from '@/components/VariantList';

const FOUR_ITEMS = [
  { id: '1', name: 'Item 1' },
  { id: '2', name: 'Item 2' },
  { id: '3', name: 'Item 3' },
  { id: '4', name: 'Item 4' },
];

const FIVE_ITEMS = [...FOUR_ITEMS, { id: '5', name: 'Item 5' }];

export function SymmetricGridDemo() {
  // #region demo
  const variants: VariantDef[] = [
    {
      label: 'complete rows (2 columns)',
      content: (
        <SymmetricGrid
          data={FOUR_ITEMS}
          keyExtractor={(item) => item.id}
          renderItem={(item) => (
            <Card>
              <Body>{item.name}</Body>
            </Card>
          )}
        />
      ),
    },
    {
      label: 'incomplete last row — centered, not ragged',
      content: (
        <SymmetricGrid
          data={FIVE_ITEMS}
          keyExtractor={(item) => item.id}
          renderItem={(item) => (
            <Card>
              <Body>{item.name}</Body>
            </Card>
          )}
        />
      ),
    },
    {
      label: 'balanceLastRow={false} — left-aligned instead',
      content: (
        <SymmetricGrid
          data={FIVE_ITEMS}
          balanceLastRow={false}
          keyExtractor={(item) => item.id}
          renderItem={(item) => (
            <Card>
              <Body>{item.name}</Body>
            </Card>
          )}
        />
      ),
    },
    {
      label: 'columns={3}',
      content: (
        <SymmetricGrid
          data={FIVE_ITEMS}
          columns={3}
          keyExtractor={(item) => item.id}
          renderItem={(item) => (
            <Card>
              <Body>{item.name}</Body>
            </Card>
          )}
        />
      ),
    },
    {
      label: 'gap={24}',
      content: (
        <SymmetricGrid
          data={FOUR_ITEMS}
          gap={24}
          keyExtractor={(item) => item.id}
          renderItem={(item) => (
            <Card>
              <Body>{item.name}</Body>
            </Card>
          )}
        />
      ),
    },
  ];
  return <VariantList variants={variants} />;
  // #endregion demo
}
