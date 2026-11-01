import React from 'react';
import { Text } from 'react-native';
import { act, render, screen } from '@testing-library/react-native';
import { UIProvider } from '../../theme/UIProvider';
import { Spinner } from '../Spinner';

function withProvider(children: React.ReactNode) {
  return <UIProvider mode="light">{children}</UIProvider>;
}

describe('Spinner', () => {
  // Las variantes propias corren loops de Animated; sin fake timers siguen
  // vivos tras el test y disparan contra un entorno ya desmontado.
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => {
    act(() => jest.runOnlyPendingTimers());
    jest.useRealTimers();
  });

  it('renders the optional text', () => {
    render(withProvider(<Spinner text="Loading..." />));
    expect(screen.getByText('Loading...')).toBeOnTheScreen();
  });

  it('renders without text', () => {
    const { toJSON } = render(withProvider(<Spinner />));
    expect(toJSON()).toBeTruthy();
  });

  it.each(['native', 'dots', 'ring'] as const)('renders the %s variant', (variant) => {
    const { toJSON } = render(withProvider(<Spinner variant={variant} testID="spinner" />));
    expect(screen.getByTestId('spinner')).toBeOnTheScreen();
    expect(toJSON()).toBeTruthy();
  });

  it('a custom indicator wins over the variant', () => {
    render(
      withProvider(<Spinner variant="dots" indicator={<Text testID="custom">brb</Text>} />)
    );
    expect(screen.getByTestId('custom')).toBeOnTheScreen();
  });

  it('unmounts cleanly while its animation loop is running', () => {
    const { unmount } = render(withProvider(<Spinner variant="ring" />));
    expect(() => unmount()).not.toThrow();
  });

  it('is announced as a busy progressbar, named by text or labels.loading', () => {
    const { rerender } = render(withProvider(<Spinner text="Syncing..." fullscreen={false} />));
    expect(screen.getByRole('progressbar', { name: 'Syncing...' })).toBeOnTheScreen();
    rerender(withProvider(<Spinner fullscreen={false} />));
    expect(screen.getByRole('progressbar', { name: 'Loading...' })).toBeOnTheScreen();
  });

  it('does not crash with empty text', () => {
    render(withProvider(<Spinner text="" fullscreen={false} />));
    expect(screen.getByRole('progressbar')).toBeOnTheScreen();
  });

  it('the ring works with non-hex colors (track uses opacity, not a hex suffix)', () => {
    render(withProvider(<Spinner variant="ring" color="rgb(255, 0, 0)" fullscreen={false} testID="s" />));
    const json = JSON.stringify(screen.toJSON());
    expect(json).not.toContain('rgb(255, 0, 0)33');
    expect(json).toContain('"opacity":0.2');
  });
});

