import React, { useState } from 'react';
import { View } from 'react-native';
import { List, Card, Body, Button, SegmentedControl } from 'orn-ui';
import { VariantList, type VariantDef } from '@/components/VariantList';

const DATA = Array.from({ length: 20 }, (_, i) => ({ id: String(i), name: `Item ${i + 1}` }));

type State = 'loaded' | 'first-load' | 'refreshing' | 'loading-more' | 'empty';

const STATES = [
  { value: 'loaded', label: 'Loaded' },
  { value: 'first-load', label: 'First load' },
  { value: 'refreshing', label: 'Refresh' },
  { value: 'loading-more', label: 'Paging' },
  { value: 'empty', label: 'Empty' },
];

export function ListDemo() {
  const [state, setState] = useState<State>('loaded');

  // #region demo
  const variants: VariantDef[] = [
    {
      label: 'every state of the same list',
      content: (
        <View style={{ flex: 1, gap: 12 }}>
          <SegmentedControl options={STATES} value={state} onChange={(next) => setState(next as State)} />
          <List
            data={state === 'empty' || state === 'first-load' ? [] : DATA}
            keyExtractor={(item) => item.id}
            isLoading={state === 'first-load'}
            isRefreshing={state === 'refreshing'}
            isLoadingMore={state === 'loading-more'}
            onRefresh={() => setState('loaded')}
            emptyTitle="No items"
            emptyDescription="Try a different filter"
            renderItem={({ item }) => (
              <Card style={{ marginBottom: 8 }}>
                <Body>{item.name}</Body>
              </Card>
            )}
          />
        </View>
      ),
    },
    {
      label: 'renderSkeletonItem — placeholders shaped like the real row',
      content: (
        <View style={{ flex: 1, gap: 12 }}>
          <Button title="Reload" variant="outline" onPress={() => setState('first-load')} />
          <List
            data={[]}
            keyExtractor={(item: { id: string }) => item.id}
            isLoading
            skeletonCount={4}
            renderSkeletonItem={() => (
              <Card style={{ marginBottom: 8, height: 64 }}>
                <View />
              </Card>
            )}
            renderItem={() => null}
          />
        </View>
      ),
    },
  ];
  return <VariantList variants={variants} fill />;
  // #endregion demo
}
