import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { ComponentDetailScreen } from '@/components/ComponentDetailScreen';
import { EXAMPLES } from '@/demos/examples/manifest';

export default function ExampleDetail() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const entry = EXAMPLES.find((e) => e.slug === slug);
  return <ComponentDetailScreen entry={entry} basePath="/examples" />;
}
