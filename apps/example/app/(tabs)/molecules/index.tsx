import React from 'react';
import { CategoryListScreen } from '@/components/CategoryListScreen';
import { MOLECULES } from '@/demos/manifest';

export default function MoleculesIndex() {
  return <CategoryListScreen title="Molecules" basePath="/molecules" entries={MOLECULES} />;
}
