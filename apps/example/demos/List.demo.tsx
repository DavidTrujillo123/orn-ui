import React, { useState } from 'react';
import { View } from 'react-native';
import { List, Card, Body, Button } from 'orn-ui';
import { VariantList, type VariantDef } from '@/components/VariantList';

const DATA = Array.from({ length: 20 }, (_, i) => ({ id: String(i), name: `Item ${i + 1}` }));

export function ListDemo() {
  const [showEmpty, setShowEmpty] = useState(false);
  // #region demo
  const variants: VariantDef[] = [
    {
      label: 'Loaded',
      content: (
        <List
          data={DATA}
          keyExtractor={(item) => item.id}
          isLoading={false}
          renderItem={({ item }) => (
            <Card style={{ marginBottom: 8 }}>
              <Body>{item.name}</Body>
            </Card>
          )}
        />
      ),
    },
    {
      label: 'Loading',
      content: <List data={[]} keyExtractor={(i: any) => i.id} isLoading loadingText="Fetching items..." renderItem={() => null} />,
    },
    {
      label: 'Empty',
      content: (
        <View style={{ flex: 1 }}>
          <Button
            title={showEmpty ? 'Reset' : 'Simulate empty result'}
            variant="outline"
            onPress={() => setShowEmpty((v) => !v)}
            style={{ marginBottom: 12 }}
          />
          <List
            data={showEmpty ? [] : DATA.slice(0, 3)}
            keyExtractor={(item: any) => item.id}
            isLoading={false}
            emptyTitle="No items"
            emptyDescription="Try a different filter"
            renderItem={({ item }: any) => (
              <Card style={{ marginBottom: 8 }}>
                <Body>{item.name}</Body>
              </Card>
            )}
          />
        </View>
      ),
    },
  ];
  return <VariantList variants={variants} fill />;
  // #endregion demo
}
