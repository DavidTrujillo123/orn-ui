import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { UIProvider } from '../../theme/UIProvider';
import { Title, Subtitle, Body, Caption } from '../Text';

function withProvider(children: React.ReactNode) {
  return <UIProvider mode="light">{children}</UIProvider>;
}

describe('Typography', () => {
  it.each([
    ['Title', Title],
    ['Subtitle', Subtitle],
    ['Body', Body],
    ['Caption', Caption],
  ] as const)('%s renders its children', (_name, Component) => {
    render(withProvider(<Component>hello</Component>));
    expect(screen.getByText('hello')).toBeOnTheScreen();
  });

  it('Title defaults to theme.colors.text', () => {
    render(withProvider(<Title>t</Title>));
    expect(screen.getByText('t')).toHaveStyle({ color: '#333333' });
  });

  it('Caption defaults to theme.colors.textLight', () => {
    render(withProvider(<Caption>c</Caption>));
    expect(screen.getByText('c')).toHaveStyle({ color: '#666666' });
  });

  it('an explicit color prop overrides the default', () => {
    render(withProvider(<Body color="#ff00ff">b</Body>));
    expect(screen.getByText('b')).toHaveStyle({ color: '#ff00ff' });
  });

  it('align controls textAlign', () => {
    render(withProvider(<Body align="center">b</Body>));
    expect(screen.getByText('b')).toHaveStyle({ textAlign: 'center' });
  });
});
