import React from 'react';
import { CategoryListScreen } from '@/components/CategoryListScreen';
import { ORGANISMS } from '@/demos/manifest';

export default function OrganismsIndex() {
  return <CategoryListScreen title="Organisms" basePath="/organisms" entries={ORGANISMS} />;
}
