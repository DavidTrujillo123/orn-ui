import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { ComponentDetailScreen } from '@/components/ComponentDetailScreen';
import { ORGANISMS } from '@/demos/manifest';

export default function OrganismDetail() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const entry = ORGANISMS.find((e) => e.slug === slug);
  return <ComponentDetailScreen entry={entry} basePath="/organisms" />;
}
