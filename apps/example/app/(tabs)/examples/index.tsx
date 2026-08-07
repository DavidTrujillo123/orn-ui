import React from 'react';
import { CategoryListScreen } from '@/components/CategoryListScreen';
import { EXAMPLES } from '@/demos/examples/manifest';

export default function ExamplesIndex() {
  return <CategoryListScreen title="Examples" basePath="/examples" entries={EXAMPLES} />;
}
