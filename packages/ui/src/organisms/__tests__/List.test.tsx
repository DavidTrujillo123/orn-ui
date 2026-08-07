import React from 'react';
import { Text, View } from 'react-native';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { UIProvider } from '../../theme/UIProvider';
import { List } from '../List';

function withProvider(children: React.ReactNode) {
  return <UIProvider mode="light">{children}</UIProvider>;
}

const items = [{ id: '1' }, { id: '2' }];

describe('List', () => {
  it('renders items via renderItem', () => {
    render(
      withProvider(
        <List
          data={items}
          keyExtractor={(i) => i.id}
          isLoading={false}
          renderItem={({ item }) => <Text>item-{item.id}</Text>}
        />
      )
    );
    expect(screen.getByText('item-1')).toBeOnTheScreen();
    expect(screen.getByText('item-2')).toBeOnTheScreen();
  });

  it('shows the empty state when there is no data and it is not loading', () => {
    render(
      withProvider(
        <List data={[]} keyExtractor={(i: any) => i.id} isLoading={false} renderItem={() => null} emptyTitle="Nothing" />
      )
    );
    expect(screen.getByText('Nothing')).toBeOnTheScreen();
  });

  it('does not show the empty state while loading', () => {
    render(
      withProvider(
        <List data={[]} keyExtractor={(i: any) => i.id} isLoading emptyTitle="Nothing" renderItem={() => null} />
      )
    );
    expect(screen.queryByText('Nothing')).not.toBeOnTheScreen();
  });

  it('shows a full-screen spinner while isReady is false', () => {
    render(
      withProvider(
        <List data={[]} keyExtractor={(i: any) => i.id} isLoading={false} isReady={false} loadingText="Please wait" renderItem={() => null} />
      )
    );
    expect(screen.getByText('Please wait')).toBeOnTheScreen();
  });

  it('calls onEndReached once when the list end is reached', () => {
    const onEndReached = jest.fn();
    render(
      withProvider(
        <List
          data={items}
          keyExtractor={(i) => i.id}
          isLoading={false}
          renderItem={({ item }) => <Text>item-{item.id}</Text>}
          onEndReached={onEndReached}
        />
      )
    );
    fireEvent(screen.UNSAFE_root.findByType(require('react-native').FlatList), 'onEndReached');
    expect(onEndReached).toHaveBeenCalledTimes(1);
  });

  it('uses an injected ListComponent instead of FlatList', () => {
    function FakeList(props: any) {
      return <View testID="fake-list">{props.data.map((d: any) => <Text key={d.id}>fake-{d.id}</Text>)}</View>;
    }
    render(
      withProvider(
        <List data={items} keyExtractor={(i) => i.id} isLoading={false} renderItem={() => null} ListComponent={FakeList} />
      )
    );
    expect(screen.getByTestId('fake-list')).toBeOnTheScreen();
    expect(screen.getByText('fake-1')).toBeOnTheScreen();
  });
});
