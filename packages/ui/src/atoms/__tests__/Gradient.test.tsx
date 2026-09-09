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

  it('interpolates opacity from 0 to 1 across the bands of a segment', () => {
    render(<Gradient colors={['#000000', '#ffffff']} steps={4} testID="g" />);
    const bands = stylesOf().filter((s) => s.backgroundColor === '#ffffff');
    expect(bands.map((b) => b.opacity)).toEqual([0, 1 / 3, 2 / 3, 1]);
  });

  it('creates one segment per color pair', () => {
    render(<Gradient colors={['#000000', '#888888', '#ffffff']} steps={3} testID="g" />);
    const styles = stylesOf();
    expect(styles.filter((s) => s.backgroundColor === '#888888')).toHaveLength(1 + 3);
    expect(styles.filter((s) => s.backgroundColor === '#ffffff')).toHaveLength(3);
  });

  it('clamps steps below 2, which could not interpolate anything', () => {
    render(<Gradient colors={['#000000', '#ffffff']} steps={1} testID="g" />);
    expect(stylesOf().filter((s) => s.backgroundColor === '#ffffff')).toHaveLength(2);
  });

  it('lays the bands out along the axis of the direction', () => {
    render(<Gradient colors={['#000000', '#ffffff']} direction="horizontal" testID="g" />);
    expect(stylesOf().some((s) => s.flexDirection === 'row')).toBe(true);
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
});
