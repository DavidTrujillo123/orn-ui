import React, { useState } from 'react';
import { View } from 'react-native';
import { List, Card, Body, Caption, Skeleton } from 'orn-ui';
import { VariantList, type VariantDef } from '@/components/VariantList';

interface Item {
  id: string;
  name: string;
}

const PAGE_SIZE = 15;
const ITEMS: Item[] = Array.from({ length: PAGE_SIZE }, (_, i) => ({ id: String(i), name: `Item ${i + 1}` }));

// Stands in for your API: page N of the feed, after a network delay.
function fetchPage(page: number): Promise<Item[]> {
  const items = Array.from({ length: PAGE_SIZE }, (_, i) => {
    const n = page * PAGE_SIZE + i + 1;
    return { id: String(n), name: `Item ${n}` };
  });
  return new Promise((resolve) => setTimeout(() => resolve(items), 1200));
}

function ItemCard({ item }: { item: Item }) {
  return (
    <Card style={{ marginBottom: 8 }}>
      <Body>{item.name}</Body>
    </Card>
  );
}

function FeedExample() {
  const [items, setItems] = useState(ITEMS);
  const [page, setPage] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const refresh = async () => {
    setRefreshing(true);
    setItems(await fetchPage(0));
    setPage(0);
    setRefreshing(false);
  };

  const loadMore = async () => {
    if (loadingMore) return;
    setLoadingMore(true);
    const next = await fetchPage(page + 1);
    setItems((current) => [...current, ...next]);
    setPage(page + 1);
    setLoadingMore(false);
  };

  return (
    <List
      data={items}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <ItemCard item={item} />}
      isLoading={false}
      isRefreshing={refreshing}
      onRefresh={refresh}
      isLoadingMore={loadingMore}
      onEndReached={loadMore}
    />
  );
}

export function ListDemo() {
  // #region demo
  const variants: VariantDef[] = [
    { label: 'Pull to refresh · infinite scroll', content: <FeedExample /> },
    {
      label: 'First load · default placeholders',
      content: (
        <List
          data={[]}
          keyExtractor={(item: Item) => item.id}
          renderItem={() => null}
          isLoading
        />
      ),
    },
    {
      label: 'renderSkeletonItem · custom placeholders',
      content: (
        <List
          data={[]}
          keyExtractor={(item: Item) => item.id}
          renderItem={() => null}
          isLoading
          skeletonCount={5}
          renderSkeletonItem={() => (
            <Card style={{ marginBottom: 8 }}>
              <Skeleton variant="text" width="40%" />
            </Card>
          )}
        />
      ),
    },
    {
      label: 'isLoadingMore · loading the next page',
      content: (
        <List
          data={ITEMS.slice(0, 4)}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ItemCard item={item} />}
          isLoading={false}
          isLoadingMore
        />
      ),
    },
    {
      label: 'Empty state',
      content: (
        <List
          data={[]}
          keyExtractor={(item: Item) => item.id}
          renderItem={() => null}
          isLoading={false}
          emptyTitle="No items"
          emptyDescription="Try a different filter"
        />
      ),
    },
    {
      label: 'ListHeaderComponent · stays while loading',
      content: (
        <List
          data={[]}
          keyExtractor={(item: Item) => item.id}
          renderItem={() => null}
          isLoading
          skeletonCount={3}
          ListHeaderComponent={
            <View style={{ marginBottom: 8 }}>
              <Caption>Recent orders</Caption>
            </View>
          }
        />
      ),
    },
  ];
  return <VariantList variants={variants} fill />;
  // #endregion demo
}
