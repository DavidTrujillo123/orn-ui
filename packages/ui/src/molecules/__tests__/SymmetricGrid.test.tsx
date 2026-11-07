import React from 'react';
import { View } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { UIProvider } from '../../theme/UIProvider';
import { SymmetricGrid } from '../SymmetricGrid';

function withProvider(children: React.ReactNode) {
  return <UIProvider mode="light">{children}</UIProvider>;
}

const ITEMS = [{ id: '1' }, { id: '2' }, { id: '3' }];

describe('SymmetricGrid', () => {
  it('renders every item', () => {
    render(
      withProvider(
        <SymmetricGrid
          data={ITEMS}
          keyExtractor={(i) => i.id}
          renderItem={(item) => <View testID={`cell-${item.id}`} />}
        />
      )
    );
    expect(screen.getByTestId('cell-1')).toBeOnTheScreen();
    expect(screen.getByTestId('cell-2')).toBeOnTheScreen();
    expect(screen.getByTestId('cell-3')).toBeOnTheScreen();
  });

  it('centers an incomplete last row by default', () => {
    render(
      withProvider(
        <SymmetricGrid
          data={ITEMS}
          columns={2}
          keyExtractor={(i) => i.id}
          renderItem={(item) => <View testID={`cell-${item.id}`} />}
        />
      )
    );
    const lastCell = screen.getByTestId('cell-3');
    // go up from the cell's host View to the row's: each function wrapper
    // (forwardRef) counts as an extra `.parent` level in the test tree.
    const row = lastCell.parent!.parent!.parent!.parent!;
    const flatten = require('react-native').StyleSheet.flatten(row.props.style);
    expect(flatten.justifyContent).toBe('center');
  });

  it('does not center the last row when balanceLastRow is false', () => {
    render(
      withProvider(
        <SymmetricGrid
          data={ITEMS}
          columns={2}
          balanceLastRow={false}
          keyExtractor={(i) => i.id}
          renderItem={(item) => <View testID={`cell-${item.id}`} />}
        />
      )
    );
    const lastCell = screen.getByTestId('cell-3');
    const row = lastCell.parent!.parent!.parent!.parent!;
    const flatten = require('react-native').StyleSheet.flatten(row.props.style);
    expect(flatten.justifyContent).toBe('flex-start');
  });

  it('does not center a full last row', () => {
    render(
      withProvider(
        <SymmetricGrid
          data={[{ id: '1' }, { id: '2' }]}
          columns={2}
          keyExtractor={(i) => i.id}
          renderItem={(item) => <View testID={`cell-${item.id}`} />}
        />
      )
    );
    const lastCell = screen.getByTestId('cell-2');
    const row = lastCell.parent!.parent!.parent!.parent!;
    const flatten = require('react-native').StyleSheet.flatten(row.props.style);
    expect(flatten.justifyContent).toBe('flex-start');
  });

  it('rows never get wider than the grid: the gap is cell padding, not flex gap', () => {
    render(
      withProvider(
        <SymmetricGrid
          data={ITEMS}
          columns={3}
          gap={12}
          testID="grid"
          keyExtractor={(i) => i.id}
          renderItem={(item) => <View testID={`cell-${item.id}`} />}
        />
      )
    );
    const flat = (style: unknown) => Object.assign({}, ...[style].flat(Infinity).filter(Boolean));
    const row = screen.getByTestId('grid').children[0] as ReturnType<typeof screen.getByTestId>;
    let cell = screen.getByTestId('cell-1').parent!;
    while (!cell.props.style) cell = cell.parent!;
    // 3 x 33.33% and nothing more: the 12pt gap lives inside each cell (6 + 6)
    // and the row bleeds 6 on each side so the outer edges stay flush.
    expect(flat(row.props.style).gap).toBeUndefined();
    expect(flat(row.props.style).marginHorizontal).toBe(-6);
    expect(flat(cell.props.style)).toMatchObject({ paddingHorizontal: 6 });
  });
});
