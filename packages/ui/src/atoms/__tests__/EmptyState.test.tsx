import React from 'react';
import { render, screen } from '@testing-library/react-native';
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
});
