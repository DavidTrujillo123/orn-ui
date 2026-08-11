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
    // subir del host View de la celda al de la fila: cada wrapper de función
    // (forwardRef) cuenta como un nivel extra de `.parent` en el árbol de test.
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
});
