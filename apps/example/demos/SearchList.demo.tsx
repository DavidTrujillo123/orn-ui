import React, { useMemo, useState } from 'react';
import { SearchList, Card, Body } from 'orn-ui';
import { VariantList, type VariantDef } from '@/components/VariantList';

const ALL = ['Apple', 'Banana', 'Cherry', 'Date', 'Elderberry', 'Fig', 'Grape', 'Honeydew'];

export function SearchListDemo() {
  const [query, setQuery] = useState('');
  const data = useMemo(() => ALL.filter((n) => n.toLowerCase().includes(query.toLowerCase())), [query]);
  // #region demo
  const variants: VariantDef[] = [
    {
      label: 'Search + results',
      content: (
        <SearchList
          searchValue={query}
          onSearchChange={setQuery}
          data={data.map((name) => ({ name }))}
          keyExtractor={(item) => item.name}
          renderItem={({ item }) => (
            <Card style={{ marginBottom: 8 }}>
              <Body>{item.name}</Body>
            </Card>
          )}
          emptyTitle="No matches"
        />
      ),
    },
    {
      label: 'With scan action',
      content: (
        <SearchList
          searchValue=""
          onSearchChange={() => {}}
          onScanPress={() => {}}
          data={[]}
          keyExtractor={(item: any) => item.name}
          renderItem={() => null}
          emptyTitle="Scan a barcode or search"
        />
      ),
    },
  ];
  return <VariantList variants={variants} fill />;
  // #endregion demo
}
