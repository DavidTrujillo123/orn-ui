import React from 'react';
import { render, screen, within } from '@testing-library/react-native';
import { UIProvider } from '../../theme/UIProvider';
import { Timeline, type TimelineItem } from '../Timeline';

const ITEMS: TimelineItem[] = [
  { label: 'Ordered', emoji: '📦' },
  { label: 'Packed', iconName: 'check' },
  { label: 'In transit', status: 'pending' },
  { label: 'Delivered', status: 'pending' },
];

function withProvider(children: React.ReactNode) {
  return <UIProvider mode="light">{children}</UIProvider>;
}

describe('Timeline', () => {
  it('renders one row per item', () => {
    render(withProvider(<Timeline items={ITEMS} testID="tl" />));
    for (const item of ITEMS) expect(screen.getByText(item.label)).toBeOnTheScreen();
    expect(screen.getAllByTestId(/^tl-item-\d$/)).toHaveLength(4);
  });

  it('renders nothing for an empty list', () => {
    render(withProvider(<Timeline items={[]} testID="tl" />));
    expect(screen.queryByTestId('tl')).toBeNull();
  });

  it('marks pending milestones as unchecked for screen readers', () => {
    render(withProvider(<Timeline items={ITEMS} testID="tl" />));
    expect(screen.getByTestId('tl-item-0')).toHaveProp('accessibilityState', { checked: true });
    expect(screen.getByTestId('tl-item-2')).toHaveProp('accessibilityState', { checked: false });
  });

  it('bows the rows off the axis, and curve={0} leaves them on it', () => {
    const { rerender } = render(withProvider(<Timeline items={ITEMS} curve={30} testID="tl" />));
    // El primero y el último caen sobre el eje; los del medio se van a un lado.
    expect(screen.getByTestId('tl-item-0')).toHaveStyle({ transform: [{ translateX: 0 }] });
    expect(screen.getByTestId('tl-item-1')).not.toHaveStyle({ transform: [{ translateX: 0 }] });

    rerender(withProvider(<Timeline items={ITEMS} curve={0} testID="tl" />));
    expect(screen.getByTestId('tl-item-1')).toHaveStyle({ transform: [{ translateX: 0 }] });
  });

  it('a single item has no gap to draw a line across', () => {
    render(withProvider(<Timeline items={[{ label: 'Only one' }]} testID="tl" />));
    expect(screen.getByText('Only one')).toBeOnTheScreen();
    expect(screen.getAllByTestId(/^tl-item-\d$/)).toHaveLength(1);
  });

  it('works without a testID', () => {
    render(withProvider(<Timeline items={ITEMS} />));
    expect(screen.getByText('Ordered')).toBeOnTheScreen();
  });

  it('the emoji wins over the icon', () => {
    render(withProvider(<Timeline items={[{ label: 'Both', emoji: '🎯', iconName: 'check' }]} testID="tl" />));
    expect(screen.getByText('🎯')).toBeOnTheScreen();
  });

  it('reserves one row of height per milestone', () => {
    render(withProvider(<Timeline items={ITEMS} spacing={50} testID="tl" />));
    expect(screen.getByTestId('tl')).toHaveStyle({ height: 4 * 50 });
  });

  it('glow={false} drops the halo layers', () => {
    const withGlow = render(withProvider(<Timeline items={ITEMS} testID="tl" />));
    const glowing = withGlow.toJSON();

    withGlow.rerender(withProvider(<Timeline items={ITEMS} glow={false} testID="tl" />));
    // El halo son Views sin texto: lo que cambia es el tamaño del árbol.
    expect(JSON.stringify(glowing).length).toBeGreaterThan(JSON.stringify(withGlow.toJSON()).length);
  });

  it('startSide flips which side the first pill goes to, and the rest alternate', () => {
    const { rerender } = render(withProvider(<Timeline items={ITEMS} testID="tl" />));
    expect(within(screen.getByTestId('tl-item-0-right')).getByText('Ordered')).toBeOnTheScreen();
    expect(within(screen.getByTestId('tl-item-1-left')).getByText('Packed')).toBeOnTheScreen();

    rerender(withProvider(<Timeline items={ITEMS} startSide="left" testID="tl" />));
    expect(within(screen.getByTestId('tl-item-0-left')).getByText('Ordered')).toBeOnTheScreen();
    expect(within(screen.getByTestId('tl-item-1-right')).getByText('Packed')).toBeOnTheScreen();
  });
});
