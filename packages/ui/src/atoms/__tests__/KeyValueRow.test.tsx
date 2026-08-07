import React from 'react';
import { Text } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { UIProvider } from '../../theme/UIProvider';
import { KeyValueRow } from '../KeyValueRow';

describe('KeyValueRow', () => {
  it('renders string label/value with default styling', () => {
    render(
      <UIProvider mode="light">
        <KeyValueRow label="Total" value="$100" />
      </UIProvider>
    );
    expect(screen.getByText('Total')).toBeOnTheScreen();
    expect(screen.getByText('$100')).toBeOnTheScreen();
  });

  it('renders numeric values', () => {
    render(
      <UIProvider mode="light">
        <KeyValueRow label="Qty" value={5} />
      </UIProvider>
    );
    expect(screen.getByText('5')).toBeOnTheScreen();
  });

  it('respects a custom React node for label/value instead of wrapping it', () => {
    render(
      <UIProvider mode="light">
        <KeyValueRow label={<Text testID="custom-label">Custom</Text>} value="v" />
      </UIProvider>
    );
    expect(screen.getByTestId('custom-label')).toBeOnTheScreen();
  });
});
