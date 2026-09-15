import React from 'react';
import { AccessibilityInfo } from 'react-native';
import { act, render, screen } from '@testing-library/react-native';
import { UIProvider } from '../../theme/UIProvider';
import { ShinyText } from '../ShinyText';

function withProvider(children: React.ReactNode) {
  return <UIProvider mode="light">{children}</UIProvider>;
}

// El barrido es un Animated.loop: sin fake timers sigue agendando frames
// después del test, contra un árbol ya desmontado.
const flush = () => act(() => jest.runOnlyPendingTimers());

describe('ShinyText', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => {
    flush();
    jest.useRealTimers();
  });

  it('splits the text into characters and keeps the whole string as the label', () => {
    render(withProvider(<ShinyText text="ab" testID="shiny" />));

    // Dos nodos por letra: el color de reposo y el brillo superpuesto.
    expect(screen.getAllByText('a')).toHaveLength(2);
    expect(screen.getAllByText('b')).toHaveLength(2);
    expect(screen.getByTestId('shiny')).toHaveProp('accessibilityLabel', 'ab');
  });

  it('a single character renders too', () => {
    render(withProvider(<ShinyText text="A" testID="shiny" />));
    expect(screen.getAllByText('A')).toHaveLength(2);
  });

  it('the space travels with its word, so a word never breaks mid-line', () => {
    render(withProvider(<ShinyText text="hi there" testID="shiny" />));

    const root = screen.getByTestId('shiny');
    // Dos grupos: 'hi ' (con su espacio) y 'there'.
    expect(root.children).toHaveLength(2);
    expect(screen.getAllByText(' ')).toHaveLength(2);
  });

  it('a trailing space stays in the last group', () => {
    render(withProvider(<ShinyText text="hi " testID="shiny" />));
    expect(screen.getByTestId('shiny').children).toHaveLength(1);
  });

  it('animated={false} renders plain text in shineColor', () => {
    render(withProvider(<ShinyText text="ab" animated={false} shineColor="#123456" testID="shiny" />));

    const node = screen.getByTestId('shiny');
    expect(node).toHaveTextContent('ab');
    expect(node).toHaveStyle({ color: '#123456' });
    expect(screen.queryAllByText('a')).toHaveLength(0);
  });

  it('empty text falls back to the plain node', () => {
    render(withProvider(<ShinyText text="" testID="shiny" />));
    expect(screen.getByTestId('shiny')).toHaveTextContent('');
  });

  it('honours reduce motion by rendering the plain node', async () => {
    const spy = jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);

    render(withProvider(<ShinyText text="ab" testID="shiny" />));
    // El hook consulta el ajuste con una promesa: hay que dejarla resolver
    // antes de mirar el árbol.
    await act(async () => {});

    expect(screen.getByTestId('shiny')).toHaveTextContent('ab');
    expect(screen.queryAllByText('a')).toHaveLength(0);

    // Se vuelve a false en vez de mockRestore(): el preset de RN ya trae
    // AccessibilityInfo mockeado, así que restaurar deja una jest.fn() que
    // devuelve undefined y el próximo montaje revienta al hacer .then().
    spy.mockResolvedValue(false);
  });

  it('align maps to the row alignment when animated and to textAlign when not', () => {
    const { rerender } = render(withProvider(<ShinyText text="ab" align="center" testID="shiny" />));
    expect(screen.getByTestId('shiny')).toHaveStyle({ justifyContent: 'center' });

    rerender(withProvider(<ShinyText text="ab" align="right" animated={false} testID="shiny" />));
    expect(screen.getByTestId('shiny')).toHaveStyle({ textAlign: 'right' });
  });

  it('color paints the resting characters', () => {
    render(withProvider(<ShinyText text="a" color="#654321" testID="shiny" />));
    expect(screen.getAllByText('a')[0]).toHaveStyle({ color: '#654321' });
  });

  it('stops the loop on unmount', () => {
    const { unmount } = render(withProvider(<ShinyText text="ab" testID="shiny" />));
    act(() => jest.advanceTimersByTime(1000));
    expect(() => unmount()).not.toThrow();
  });
});
