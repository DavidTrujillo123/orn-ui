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

  it('Title is announced as a header so screen readers can jump between titles', () => {
    render(withProvider(<Title>Invoice</Title>));
    expect(screen.getByRole('header', { name: 'Invoice' })).toBeOnTheScreen();
  });

  it.each([
    ['Subtitle', Subtitle],
    ['Body', Body],
    ['Caption', Caption],
  ] as const)('%s is not a header', (_name, Component) => {
    render(withProvider(<Component>plain</Component>));
    expect(screen.queryByRole('header')).toBeNull();
  });

  it('Title accepts an explicit accessibilityRole override', () => {
    render(withProvider(<Title accessibilityRole="text">t</Title>));
    expect(screen.queryByRole('header')).toBeNull();
  });

  it('Title takes lineHeight and letterSpacing from the theme tokens', () => {
    render(withProvider(<Title>t</Title>));
    expect(screen.getByText('t')).toHaveStyle({ lineHeight: 30, letterSpacing: -0.5 });
  });
});
