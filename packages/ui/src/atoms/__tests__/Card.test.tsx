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

  it('has a hairline border only in dark mode, where the shadow does not show', () => {
    const { StyleSheet, Text } = require('react-native');
    const { rerender } = render(
      <UIProvider mode="dark">
        <Card testID="card">
          <Text>x</Text>
        </Card>
      </UIProvider>
    );
    expect(screen.getByTestId('card')).toHaveStyle({ borderWidth: StyleSheet.hairlineWidth });
    rerender(
      <UIProvider mode="light">
        <Card testID="card">
          <Text>x</Text>
        </Card>
      </UIProvider>
    );
    expect(screen.getByTestId('card')).not.toHaveStyle({ borderWidth: StyleSheet.hairlineWidth });
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

