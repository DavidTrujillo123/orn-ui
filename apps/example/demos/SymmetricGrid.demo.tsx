import React from 'react';
import { SymmetricGrid, Card, Body } from 'orn-ui';
import { VariantList, type VariantDef } from '@/components/VariantList';

interface Product {
  id: string;
  name: string;
}

function tile(name: string) {
  return (
    <Card style={{ height: 72, alignItems: 'center', justifyContent: 'center' }}>
      <Body>{name}</Body>
    </Card>
  );
}

const FULL: Product[] = Array.from({ length: 4 }, (_, i) => ({ id: String(i), name: `Item ${i + 1}` }));
const INCOMPLETE: Product[] = Array.from({ length: 5 }, (_, i) => ({ id: String(i), name: `Item ${i + 1}` }));

export function SymmetricGridDemo() {
  // #region demo
  const variants: VariantDef[] = [
    {
      label: 'complete rows (2 columns)',
      content: (
        <SymmetricGrid
          data={FULL}
          columns={2}
          keyExtractor={(item) => item.id}
          renderItem={(item) => tile(item.name)}
        />
      ),
    },
    {
      label: 'incomplete last row — centered, not ragged',
      content: (
        <SymmetricGrid
          data={INCOMPLETE}
          columns={2}
          keyExtractor={(item) => item.id}
          renderItem={(item) => tile(item.name)}
        />
      ),
    },
    {
      label: 'balanceLastRow={false} — left-aligned instead',
      content: (
        <SymmetricGrid
          data={INCOMPLETE}
          columns={2}
          balanceLastRow={false}
          keyExtractor={(item) => item.id}
          renderItem={(item) => tile(item.name)}
        />
      ),
    },
    {
      label: '3 columns',
      content: (
        <SymmetricGrid
          data={INCOMPLETE}
          columns={3}
          keyExtractor={(item) => item.id}
          renderItem={(item) => tile(item.name)}
        />
      ),
    },
  ];
  return <VariantList variants={variants} />;
  // #endregion demo
}
