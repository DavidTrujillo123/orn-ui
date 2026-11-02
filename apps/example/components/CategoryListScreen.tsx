import React from 'react';
import { FlatList } from 'react-native';
import { Screen } from 'orn-ui';
import { useRouter, type Href } from 'expo-router';
import { CategoryHeader } from './CategoryHeader';
import { ComponentListItem } from './ComponentListItem';
import type { DemoEntry } from '@/demos/manifest';

/** List of a category's components (Atoms/Molecules/Organisms). Each row navigates to its detail. */
export function CategoryListScreen({ title, basePath, entries }: { title: string; basePath: string; entries: DemoEntry[] }) {
  const router = useRouter();
  return (
    <Screen scrollable={false} edges={['top']}>
      <CategoryHeader title={title} />
      <FlatList
        data={entries}
        keyExtractor={(e) => e.slug}
        renderItem={({ item }) => (
          <ComponentListItem
            name={item.name}
            description={item.description}
            onPress={() => router.push(`${basePath}/${item.slug}` as Href)}
          />
        )}
      />
    </Screen>
  );
}
