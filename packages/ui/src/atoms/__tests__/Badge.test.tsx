import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { UIProvider } from '../../theme/UIProvider';
import { Badge } from '../Badge';

function withProvider(children: React.ReactNode) {
  return <UIProvider mode="light">{children}</UIProvider>;
}

describe('Badge', () => {
  it('renders the label', () => {
    render(withProvider(<Badge label="PAID" variant="success" />));
    expect(screen.getByText('PAID')).toBeOnTheScreen();
  });

  it('an explicit backgroundColor/textColor override the variant palette', () => {
    render(withProvider(<Badge label="X" variant="success" backgroundColor="#123456" textColor="#abcdef" />));
    expect(screen.getByText('X')).toHaveStyle({ color: '#abcdef' });
  });

  it.each(['success', 'error', 'warning', 'info', 'neutral'] as const)(
    'renders the %s variant without crashing',
    (variant) => {
      render(withProvider(<Badge label="X" variant={variant} />));
      expect(screen.getByText('X')).toBeOnTheScreen();
    }
  );
});
