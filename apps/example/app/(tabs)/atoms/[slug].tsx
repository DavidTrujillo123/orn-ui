import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { ComponentDetailScreen } from '@/components/ComponentDetailScreen';
import { ATOMS } from '@/demos/manifest';

export default function AtomDetail() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const entry = ATOMS.find((e) => e.slug === slug);
  return <ComponentDetailScreen entry={entry} basePath="/atoms" />;
}
