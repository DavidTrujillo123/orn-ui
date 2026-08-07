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
});
