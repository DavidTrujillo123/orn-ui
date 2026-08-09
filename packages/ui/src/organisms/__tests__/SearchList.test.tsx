import React from 'react';
import { Text, View } from 'react-native';
import { act, render, screen, fireEvent } from '@testing-library/react-native';
import { UIProvider } from '../../theme/UIProvider';
import { SearchList } from '../SearchList';

function withProvider(children: React.ReactNode) {
  return <UIProvider mode="light">{children}</UIProvider>;
}

const items = [{ id: '1', name: 'Apple' }];

describe('SearchList', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => {
    act(() => jest.runOnlyPendingTimers());
    jest.useRealTimers();
  });

  it('propagates search input changes', () => {
    const onSearchChange = jest.fn();
    render(
      withProvider(
        <SearchList
          searchValue=""
          onSearchChange={onSearchChange}
          data={items}
          keyExtractor={(i) => i.id}
          renderItem={({ item }) => <Text>{item.name}</Text>}
        />
      )
    );
    fireEvent.changeText(screen.getByPlaceholderText('Search...'), 'ap');
    expect(onSearchChange).toHaveBeenCalledWith('ap');
  });

  it('clears the search when the clear icon is pressed', () => {
    const onSearchChange = jest.fn();
    render(
      withProvider(
        <SearchList
          searchValue="apple"
          onSearchChange={onSearchChange}
          data={items}
          keyExtractor={(i) => i.id}
          renderItem={({ item }) => <Text>{item.name}</Text>}
        />
      )
    );
    fireEvent.press(screen.getByRole('button', { name: 'Clear' }));
    expect(onSearchChange).toHaveBeenCalledWith('');
  });

  it('does not render the scan button when onScanPress is omitted', () => {
    render(
      withProvider(
        <SearchList
          searchValue=""
          onSearchChange={() => {}}
          data={items}
          keyExtractor={(i) => i.id}
          renderItem={({ item }) => <Text>{item.name}</Text>}
        />
      )
    );
    expect(screen.queryByRole('button', { name: 'Scan' })).not.toBeOnTheScreen();
  });

  it('renders the scan button when onScanPress is provided', () => {
    render(
      withProvider(
        <SearchList
          searchValue=""
          onSearchChange={() => {}}
          onScanPress={() => {}}
          data={items}
          keyExtractor={(i) => i.id}
          renderItem={({ item }) => <Text>{item.name}</Text>}
        />
      )
    );
    expect(screen.getByRole('button', { name: 'Scan' })).toBeOnTheScreen();
  });

  it('shows the empty state when there is no data', () => {
    render(
      withProvider(
        <SearchList
          searchValue=""
          onSearchChange={() => {}}
          data={[]}
          keyExtractor={(i: any) => i.id}
          renderItem={() => null}
          emptyTitle="Nada"
        />
      )
    );
    expect(screen.getByText('Nada')).toBeOnTheScreen();
  });

  it('does not show the empty state while loading', () => {
    render(
      withProvider(
        <SearchList
          searchValue=""
          onSearchChange={() => {}}
          data={[]}
          keyExtractor={(i: any) => i.id}
          isLoading
          emptyTitle="Nada"
          renderItem={() => null}
        />
      )
    );
    expect(screen.queryByText('Nada')).not.toBeOnTheScreen();
  });

  it('shows placeholders instead of an empty state during the initial load', () => {
    render(
      withProvider(
        <SearchList
          searchValue=""
          onSearchChange={() => {}}
          data={[]}
          keyExtractor={(i: any) => i.id}
          isLoading
          emptyTitle="Nada"
          renderItem={() => null}
        />
      )
    );
    expect(screen.getByTestId('list-skeleton')).toBeOnTheScreen();
  });

  it('renders a custom skeleton item when provided', () => {
    render(
      withProvider(
        <SearchList
          searchValue=""
          onSearchChange={() => {}}
          data={[]}
          keyExtractor={(i: any) => i.id}
          isLoading
          skeletonCount={2}
          renderSkeletonItem={() => <Text>ghost item</Text>}
          renderItem={() => null}
        />
      )
    );
    expect(screen.getAllByText('ghost item')).toHaveLength(2);
  });

  it('shows a full-screen spinner while isReady is false', () => {
    render(
      withProvider(
        <SearchList
          searchValue=""
          onSearchChange={() => {}}
          data={[]}
          keyExtractor={(i: any) => i.id}
          isReady={false}
          loadingText="Please wait"
          renderItem={() => null}
        />
      )
    );
    expect(screen.getByText('Please wait')).toBeOnTheScreen();
  });

  it('shows the pagination loader together with a custom ListFooterComponent', () => {
    render(
      withProvider(
        <SearchList
          searchValue=""
          onSearchChange={() => {}}
          data={items}
          keyExtractor={(i) => i.id}
          isLoadingMore
          loadingMoreText="Loading more..."
          ListFooterComponent={<Text>custom footer</Text>}
          renderItem={({ item }) => <Text>{item.name}</Text>}
        />
      )
    );
    expect(screen.getByText('custom footer')).toBeOnTheScreen();
    expect(screen.getByText('Loading more...')).toBeOnTheScreen();
  });

  it('supports pull-to-refresh control when onRefresh is provided', () => {
    render(
      withProvider(
        <SearchList
          searchValue=""
          onSearchChange={() => {}}
          data={items}
          keyExtractor={(i) => i.id}
          isRefreshing
          onRefresh={() => {}}
          renderItem={({ item }) => <Text>{item.name}</Text>}
        />
      )
    );
    const list = screen.UNSAFE_root.findByType(require('react-native').FlatList);
    expect(list.props.refreshControl.props.refreshing).toBe(true);
  });
});

