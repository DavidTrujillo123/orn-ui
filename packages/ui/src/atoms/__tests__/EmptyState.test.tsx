import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { UIProvider } from '../../theme/UIProvider';
import { EmptyState } from '../EmptyState';

describe('EmptyState', () => {
  it('falls back to the provider default labels', () => {
    render(
      <UIProvider mode="light">
        <EmptyState />
      </UIProvider>
    );
    expect(screen.getByText('No results found')).toBeOnTheScreen();
  });

  it('an explicit title/description override the defaults', () => {
    render(
      <UIProvider mode="light">
        <EmptyState title="Nada aquí" description="Prueba otra búsqueda" />
      </UIProvider>
    );
    expect(screen.getByText('Nada aquí')).toBeOnTheScreen();
    expect(screen.getByText('Prueba otra búsqueda')).toBeOnTheScreen();
  });

  it('honors custom labels configured on UIProvider', () => {
    render(
      <UIProvider mode="light" labels={{ noResultsTitle: 'Sin resultados' }}>
        <EmptyState />
      </UIProvider>
    );
    expect(screen.getByText('Sin resultados')).toBeOnTheScreen();
  });

  it('spaces title and description on the token scale (proximity) and takes style arrays', () => {
    render(
      <UIProvider mode="light">
        <EmptyState title="T" description="D" testID="empty" style={[{ marginTop: 8 }, { padding: 0 }]} />
      </UIProvider>
    );
    // Ícono → título: spacing.md (12). Título → descripción: spacing.xs (4).
    expect(screen.getByText('T')).toHaveStyle({ marginTop: 12, lineHeight: 24 });
    expect(screen.getByText('D')).toHaveStyle({ marginTop: 4, lineHeight: 20 });
    expect(screen.getByTestId('empty')).toHaveStyle({ marginTop: 8, padding: 0 });
  });

  it('the title stands out from the description (similarity)', () => {
    render(
      <UIProvider mode="light">
        <EmptyState title="T" description="D" />
      </UIProvider>
    );
    expect(screen.getByText('T')).toHaveStyle({ color: '#333333' });
    expect(screen.getByText('D')).toHaveStyle({ color: '#666666' });
  });

  it('action renders a focusable button that fires onPress', () => {
    const onPress = jest.fn();
    render(
      <UIProvider mode="light">
        <EmptyState title="No clients yet" action={{ label: 'Add client', onPress }} />
      </UIProvider>
    );
    fireEvent.press(screen.getByRole('button', { name: 'Add client' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
