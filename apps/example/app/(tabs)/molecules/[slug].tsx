import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { ComponentDetailScreen } from '@/components/ComponentDetailScreen';
import { MOLECULES } from '@/demos/manifest';

export default function MoleculeDetail() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const entry = MOLECULES.find((e) => e.slug === slug);
  return <ComponentDetailScreen entry={entry} basePath="/molecules" />;
}
