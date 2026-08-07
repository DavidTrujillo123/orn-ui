import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { Avatar, Badge, Body, Caption, IconButton, SearchList, useAlert } from 'orn-ui';

interface Client {
  id: string;
  name: string;
  email: string;
  status: 'active' | 'inactive';
}

const FIRST = ['Jane', 'Marcus', 'Olivia', 'Sam', 'Priya', 'Diego', 'Nora', 'Yusuf', 'Elena', 'Kofi'];
const LAST = ['Doe', 'Nguyen', 'Rossi', 'Kim', 'Patel', 'Silva', 'Larsen', 'Ito', 'Novak', 'Mensah'];

const ALL_CLIENTS: Client[] = Array.from({ length: 42 }, (_, i) => {
  const name = `${FIRST[i % FIRST.length]} ${LAST[(i * 3) % LAST.length]}`;
  return {
    id: String(i + 1),
    name,
    email: `${name.toLowerCase().replace(' ', '.')}@example.com`,
    status: i % 4 === 0 ? 'inactive' : 'active',
  };
});

const PAGE_SIZE = 8;

/**
 * ClientListExample
 * Lista real con búsqueda, paginación incremental y borrado con
 * confirmación imperativa — SearchList + Avatar + Badge + IconButton +
 * useAlert trabajando juntos sobre datos que sí cambian con el tiempo
 * (no solo el layout estático de los demos por componente).
 */
export function ClientListExample() {
  const { confirm } = useAlert();
  const [query, setQuery] = useState('');
  const [clients, setClients] = useState(ALL_CLIENTS);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // Busca también por email: el placeholder promete "search clients" y filtrar
  // sólo por nombre hacía ver "No clients found" al pegar una dirección.
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter((c) => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q));
  }, [clients, query]);
  const page = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  const handleDelete = async (client: Client) => {
    const ok = await confirm({
      title: `Remove ${client.name}?`,
      message: 'This client will be removed from your list.',
      destructive: true,
      confirmText: 'Remove',
    });
    if (ok) setClients((prev) => prev.filter((c) => c.id !== client.id));
  };

  return (
    <View style={{ flex: 1, paddingHorizontal: 20 }}>
      <SearchList
        searchValue={query}
        onSearchChange={(text) => {
          setQuery(text);
          setVisibleCount(PAGE_SIZE);
        }}
        searchPlaceholder="Search clients..."
        data={page}
        keyExtractor={(c) => c.id}
        onLoadMore={() => setVisibleCount((v) => v + PAGE_SIZE)}
        hasMore={hasMore}
        noMoreText="No more clients"
        emptyTitle="No clients found"
        emptyDescription="Try a different name"
        renderItem={({ item }: { item: Client }) => (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              paddingVertical: 10,
              paddingHorizontal: 4,
            }}
          >
            <Avatar size={40}>
              <Body style={{ fontWeight: '700' }}>
                {item.name
                  .split(' ')
                  .map((p) => p[0])
                  .join('')}
              </Body>
            </Avatar>
            <View style={{ flex: 1 }}>
              <Body style={{ fontWeight: '600' }}>{item.name}</Body>
              <Caption>{item.email}</Caption>
            </View>
            <Badge label={item.status === 'active' ? 'ACTIVE' : 'INACTIVE'} variant={item.status === 'active' ? 'success' : 'neutral'} />
            <IconButton iconName="close" accessibilityLabel={`Remove ${item.name}`} onPress={() => handleDelete(item)} />
          </View>
        )}
      />
    </View>
  );
}
