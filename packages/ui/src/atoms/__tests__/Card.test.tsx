import React from 'react';
import { Text } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { UIProvider } from '../../theme/UIProvider';
import { Card } from '../Card';

describe('Card', () => {
  it('renders its children', () => {
    render(
      <UIProvider mode="light">
        <Card>
          <Text>inside</Text>
        </Card>
      </UIProvider>
    );
    expect(screen.getByText('inside')).toBeOnTheScreen();
  });

  it('has a visible 1pt border only in dark mode, where the shadow does not show', () => {
    const { Text } = require('react-native');
    const { rerender } = render(
      <UIProvider mode="dark">
        <Card testID="card">
          <Text>x</Text>
        </Card>
      </UIProvider>
    );
    // 1pt in a color that stands out from surface: a hairline in #2a2a2e
    // (1.17:1 on #1e1e1e) vanished on another surface.
    expect(screen.getByTestId('card')).toHaveStyle({ borderWidth: 1, borderColor: '#3a3a40' });
    // The fill is lighter than surface (#1e1e1e): elevation in dark reads as
    // a lighter tile, not a shadow.
    expect(screen.getByTestId('card')).toHaveStyle({ backgroundColor: '#303036' });
    rerender(
      <UIProvider mode="light">
        <Card testID="card">
          <Text>x</Text>
        </Card>
      </UIProvider>
    );
    expect(screen.getByTestId('card')).not.toHaveStyle({ borderWidth: 1 });
  });

  it('accepts a style array', () => {
    const { Text } = require('react-native');
    render(
      <UIProvider mode="light">
        <Card testID="card" style={[{ margin: 4 }, { padding: 2 }]}>
          <Text>x</Text>
        </Card>
      </UIProvider>
    );
    expect(screen.getByTestId('card')).toHaveStyle({ margin: 4, padding: 2 });
  });
});

