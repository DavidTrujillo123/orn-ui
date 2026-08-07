import React from 'react';
import { Text } from 'react-native';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { UIProvider } from '../../theme/UIProvider';
import { SearchList } from '../SearchList';

function withProvider(children: React.ReactNode) {
  return <UIProvider mode="light">{children}</UIProvider>;
}

const items = [{ id: '1', name: 'Apple' }];

describe('SearchList', () => {
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
});
