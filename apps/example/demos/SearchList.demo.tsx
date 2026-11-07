import React, { useState } from 'react';
import { SearchList, Card, Body } from 'orn-ui';
import { VariantList, type VariantDef } from '@/components/VariantList';

const FRUITS = ['Apple', 'Banana', 'Cherry', 'Date', 'Elderberry', 'Fig', 'Grape', 'Honeydew'];

function FruitSearchExample() {
  const [query, setQuery] = useState('');
  const results = FRUITS.filter((name) => name.toLowerCase().includes(query.toLowerCase()));
  return (
    <SearchList
      searchValue={query}
      onSearchChange={setQuery}
      data={results}
      keyExtractor={(name) => name}
      renderItem={({ item }) => (
        <Card style={{ marginBottom: 8 }}>
          <Body>{item}</Body>
        </Card>
      )}
      emptyTitle="No matches"
    />
  );
}

function ScanSearchExample() {
  const [query, setQuery] = useState('');
  return (
    <SearchList
      searchValue={query}
      onSearchChange={setQuery}
      onScanPress={() => {}}
      data={[] as string[]}
      keyExtractor={(code) => code}
      renderItem={({ item }) => <Body>{item}</Body>}
      emptyTitle="Scan a barcode or search"
    />
  );
}

export function SearchListDemo() {
  // #region demo
  const variants: VariantDef[] = [
    { label: 'Search + results', content: <FruitSearchExample /> },
    { label: 'With scan action', content: <ScanSearchExample /> },
  ];
  return <VariantList variants={variants} fill />;
  // #endregion demo
}
