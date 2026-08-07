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
});
