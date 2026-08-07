import React from 'react';
import { CategoryListScreen } from '@/components/CategoryListScreen';
import { ATOMS } from '@/demos/manifest';

export default function AtomsIndex() {
  return <CategoryListScreen title="Atoms" basePath="/atoms" entries={ATOMS} />;
}
