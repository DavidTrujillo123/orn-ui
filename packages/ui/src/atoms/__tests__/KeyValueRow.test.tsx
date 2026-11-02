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

  it('both sides shrink so a long value wraps instead of overflowing', () => {
    render(
      <UIProvider mode="light">
        <KeyValueRow label="Address" value="1600 Amphitheatre Parkway, Mountain View, CA" />
      </UIProvider>
    );
    expect(screen.getByText('Address')).toHaveStyle({ flexShrink: 0, maxWidth: '50%' });
    expect(screen.getByText('1600 Amphitheatre Parkway, Mountain View, CA')).toHaveStyle({
      flexShrink: 1,
      fontVariant: ['tabular-nums'],
    });
  });

  it('text label and value read as one element; a custom node keeps its own', () => {
    const { rerender } = render(
      <UIProvider mode="light">
        <KeyValueRow label="Subtotal" value="$300.00" testID="row" />
      </UIProvider>
    );
    expect(screen.getByTestId('row')).toHaveProp('accessible', true);

    rerender(
      <UIProvider mode="light">
        <KeyValueRow label="Status" value={<Text>PAID</Text>} testID="row" />
      </UIProvider>
    );
    expect(screen.getByTestId('row')).not.toHaveProp('accessible', true);
  });
});
