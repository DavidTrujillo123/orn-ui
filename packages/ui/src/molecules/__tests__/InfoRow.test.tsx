import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { UIProvider } from '../../theme/UIProvider';
import { InfoRow } from '../InfoRow';

function withProvider(children: React.ReactNode) {
  return <UIProvider mode="light">{children}</UIProvider>;
}

describe('InfoRow', () => {
  it('renders the value when present', () => {
    render(withProvider(<InfoRow icon="info" label="Email" value="a@b.com" placeholder="—" />));
    expect(screen.getByText('a@b.com')).toBeOnTheScreen();
  });

  it('renders the placeholder when value is missing', () => {
    render(withProvider(<InfoRow icon="info" label="Email" value={undefined} placeholder="No email" />));
    expect(screen.getByText('No email')).toBeOnTheScreen();
  });

  it('reads as one element: label then value', () => {
    render(withProvider(<InfoRow icon="info" label="Email" value="a@b.com" placeholder="No email" testID="row" />));
    const row = screen.getByTestId('row');
    expect(row.props.accessible).toBe(true);
    expect(row.props.accessibilityLabel).toBe('Email, a@b.com');
  });

  it('announces the placeholder when the value is empty', () => {
    render(withProvider(<InfoRow icon="info" label="Phone" value="" placeholder="No phone" testID="row" />));
    expect(screen.getByTestId('row').props.accessibilityLabel).toBe('Phone, No phone');
    expect(screen.getByText('No phone')).toHaveStyle({ fontStyle: 'italic' });
  });
});
