import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { UIProvider } from '../../theme/UIProvider';
import { AvatarHeader } from '../AvatarHeader';

function withProvider(children: React.ReactNode) {
  return <UIProvider mode="light">{children}</UIProvider>;
}

describe('AvatarHeader', () => {
  it('renders initials when no iconName is given', () => {
    render(withProvider(<AvatarHeader initials="JD" title="John Doe" />));
    expect(screen.getByText('JD', { includeHiddenElements: true })).toBeTruthy();
    expect(screen.getByText('John Doe')).toBeOnTheScreen();
  });

  it('renders a string subtitle', () => {
    render(withProvider(<AvatarHeader initials="JD" title="John Doe" subtitle="Cliente" />));
    expect(screen.getByText('Cliente')).toBeOnTheScreen();
  });

  it('renders a React node subtitle as-is', () => {
    const { Text } = require('react-native');
    render(
      withProvider(
        <AvatarHeader initials="JD" title="John Doe" subtitle={<Text testID="custom-subtitle">Custom</Text>} />
      )
    );
    expect(screen.getByTestId('custom-subtitle')).toBeOnTheScreen();
  });

  it('renders an iconName instead of initials, with a custom color', () => {
    render(withProvider(<AvatarHeader iconName="check" iconColor="#ff0000" title="Done" />));
    expect(screen.getByText('Done')).toBeOnTheScreen();
  });

  it('announces the title as a header and hides the decorative circle', () => {
    render(withProvider(<AvatarHeader initials="JD" title="John Doe" />));
    expect(screen.getByRole('header', { name: 'John Doe' })).toBeOnTheScreen();
    expect(screen.queryByText('JD')).not.toBeOnTheScreen();
    expect(screen.getByText('JD', { includeHiddenElements: true })).toBeTruthy();
  });

  it('falls back to a user icon when there is neither iconName nor initials', () => {
    render(withProvider(<AvatarHeader title="Guest" testID="hdr" />));
    expect(screen.getByTestId('hdr')).toBeOnTheScreen();
    expect(screen.UNSAFE_getAllByProps({ name: 'user' }).length).toBeGreaterThan(0);
  });

  it('centers a long subtitle so it stays on the axis', () => {
    render(withProvider(<AvatarHeader initials="JD" title="John Doe" subtitle="A long supporting line" />));
    expect(screen.getByText('A long supporting line')).toHaveStyle({ textAlign: 'center' });
  });
});
