import React from 'react';
import { Text } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { Gradient } from '../Gradient';

type Node = { props?: Record<string, any>; children?: Node[] | null } | string | null;

function flatten(style: unknown): Record<string, any> {
  if (Array.isArray(style)) return style.reduce<Record<string, any>>((acc, s) => ({ ...acc, ...flatten(s) }), {});
  return (style as Record<string, any>) ?? {};
}

function collectStyles(node: Node): Record<string, any>[] {
  if (!node || typeof node === 'string') return [];
  const own = node.props?.style ? [flatten(node.props.style)] : [];
  const kids = Array.isArray(node.children) ? node.children.flatMap(collectStyles) : [];
  return [...own, ...kids];
}

function stylesOf(): Record<string, any>[] {
  return collectStyles(screen.toJSON() as Node);
}

describe('Gradient', () => {
  it('renders children over the gradient', () => {
    render(
      <Gradient colors={['#000000', '#ffffff']}>
        <Text>on top</Text>
      </Gradient>
    );
    expect(screen.getByText('on top')).toBeOnTheScreen();
  });

  it('paints nothing when there are no colors', () => {
    render(<Gradient colors={[]} testID="g" />);
    expect(stylesOf().some((s) => s.backgroundColor)).toBe(false);
  });

  it('paints a flat fill with a single color', () => {
    render(<Gradient colors={['#ff0000']} testID="g" />);
    const fills = stylesOf().filter((s) => s.backgroundColor === '#ff0000');
    expect(fills).toHaveLength(1);
  });

  it('stacks layers whose combined opacity is k/(n-1) in band k (0, 1/3, 2/3, 1 for 4 steps)', () => {
    render(<Gradient colors={['#000000', '#ffffff']} steps={4} testID="g" />);
    const layers = stylesOf().filter((s) => s.backgroundColor === '#ffffff');
    // Capas "over": opacidad total tras k capas = 1 - Π(1 - a_i).
    let remaining = 1;
    const totals = layers.map((l) => {
      remaining *= 1 - l.opacity;
      return 1 - remaining;
    });
    expect(totals.map((t) => +t.toFixed(6))).toEqual([+(1 / 3).toFixed(6), +(2 / 3).toFixed(6), 1]);
    expect(layers.map((l) => l.top)).toEqual(['25%', '50%', '75%']);
  });

  it('every layer runs to the end of the plane, so no band edge borders a gap (no seams)', () => {
    render(<Gradient colors={['#000000', '#ffffff']} steps={4} testID="g" />);
    const layers = stylesOf().filter((s) => s.backgroundColor === '#ffffff');
    expect(layers.every((l) => l.bottom === 0 && l.position === 'absolute')).toBe(true);
  });

  it('creates one segment per color pair, each starting where the previous ends', () => {
    render(<Gradient colors={['#000000', '#888888', '#ffffff']} steps={3} testID="g" />);
    const styles = stylesOf();
    // Tramo 2 (fondo #888888) + 2 capas #888888 del tramo 1.
    expect(styles.filter((s) => s.backgroundColor === '#888888')).toHaveLength(1 + 2);
    expect(styles.filter((s) => s.backgroundColor === '#ffffff')).toHaveLength(2);
    expect(styles.find((s) => s.backgroundColor === '#888888' && s.opacity === undefined)?.top).toBe('50%');
  });

  it('clamps steps below 2, which could not interpolate anything', () => {
    render(<Gradient colors={['#000000', '#ffffff']} steps={1} testID="g" />);
    expect(stylesOf().filter((s) => s.backgroundColor === '#ffffff')).toHaveLength(1);
  });

  it('lays the bands out along the axis of the direction', () => {
    render(<Gradient colors={['#000000', '#ffffff']} direction="horizontal" testID="g" />);
    const layers = stylesOf().filter((s) => s.backgroundColor === '#ffffff');
    expect(layers.every((l) => typeof l.left === 'string' && l.right === 0)).toBe(true);
  });

  it('rotates the plane in opposite senses for both diagonals', () => {
    render(<Gradient colors={['#000000', '#ffffff']} direction="diagonal" testID="g" />);
    expect(stylesOf().some((s) => s.transform?.[0]?.rotate === '-45deg')).toBe(true);

    screen.rerender(<Gradient colors={['#000000', '#ffffff']} direction="diagonal-reverse" testID="g" />);
    expect(stylesOf().some((s) => s.transform?.[0]?.rotate === '45deg')).toBe(true);
  });

  it('does not intercept touches meant for its children', () => {
    render(<Gradient colors={['#000000', '#ffffff']} testID="g" />);
    const root = screen.getByTestId('g');
    const painted = root.children[0] as any;
    expect(painted.props.pointerEvents).toBe('none');
  });

  it('sizes the diagonal plane from the measured box, so wide boxes keep their corners painted', () => {
    const { fireEvent } = require('@testing-library/react-native');
    render(<Gradient colors={['#000000', '#ffffff']} direction="diagonal" testID="g" />);
    fireEvent(screen.getByTestId('g'), 'layout', { nativeEvent: { layout: { width: 300, height: 100 } } });
    const plane = stylesOf().find((s) => s.transform?.[0]?.rotate === '-45deg')!;
    const side = Math.hypot(300, 100);
    expect(plane.width).toBeCloseTo(side);
    expect(plane.height).toBeCloseTo(side);
    expect(plane.left).toBeCloseTo((300 - side) / 2);
  });
});

