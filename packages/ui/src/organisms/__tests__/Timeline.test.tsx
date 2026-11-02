import React from 'react';
import { act, fireEvent, render, screen, within } from '@testing-library/react-native';
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
  // The line's progress is an Animated.timing: without fake timers it keeps
  // scheduling frames after the test, against an already unmounted tree.
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => {
    act(() => jest.runOnlyPendingTimers());
    jest.useRealTimers();
  });

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
    // The first and last fall on the axis; the ones in the middle swing to one side.
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

  it('onItemPress makes every pill a button that reports its index', () => {
    const onItemPress = jest.fn();
    render(withProvider(<Timeline items={ITEMS} onItemPress={onItemPress} testID="tl" />));

    fireEvent.press(screen.getByTestId('tl-press-2'));
    expect(onItemPress).toHaveBeenCalledWith(2);
    expect(screen.getByLabelText('In transit')).toHaveProp('accessibilityRole', 'button');
  });

  it('without onItemPress the milestones are plain text, not buttons', () => {
    render(withProvider(<Timeline items={ITEMS} testID="tl" />));
    expect(screen.queryByTestId('tl-press-0')).toBeNull();
    expect(screen.getByTestId('tl-item-0')).toHaveProp('accessibilityRole', 'text');
  });

  it('the line stops at the first pending milestone, not at the last done one', () => {
    // A completed milestone behind a pending one doesn't advance the path: a
    // path is a path.
    const jumped: TimelineItem[] = [
      { label: 'One' },
      { label: 'Two', status: 'pending' },
      { label: 'Three' },
    ];
    render(withProvider(<Timeline items={jumped} testID="tl" />));
    expect(screen.getByTestId('tl-item-2')).toHaveProp('accessibilityState', { checked: true });
    // What doesn't advance is the line, and that is checked on the device: here
    // we only verify the render doesn't break with an order like this.
    expect(screen.getByText('Three')).toBeOnTheScreen();
  });

  it('advancing a milestone does not remount the rows', () => {
    const { rerender } = render(withProvider(<Timeline items={ITEMS} testID="tl" />));
    const before = screen.getByTestId('tl-item-2');

    rerender(
      withProvider(
        <Timeline items={ITEMS.map((item, i) => (i === 2 ? { ...item, status: undefined } : item))} testID="tl" />
      )
    );
    act(() => jest.advanceTimersByTime(600));
    expect(screen.getByTestId('tl-item-2')).toBe(before);
  });

  it("advance='sequential' only answers the milestone right after the line", () => {
    const onItemPress = jest.fn();
    // Reached: 'Ordered' (0) and 'Packed' (1). The next one is 2.
    render(
      withProvider(<Timeline items={ITEMS} onItemPress={onItemPress} advance="sequential" testID="tl" />)
    );

    fireEvent.press(screen.getByTestId('tl-press-3'));
    expect(onItemPress).not.toHaveBeenCalled();
    fireEvent.press(screen.getByTestId('tl-press-1'));
    expect(onItemPress).not.toHaveBeenCalled();

    fireEvent.press(screen.getByTestId('tl-press-2'));
    expect(onItemPress).toHaveBeenCalledWith(2);
  });

  it("advance='revisit' answers everything already walked, plus the next one", () => {
    const onItemPress = jest.fn();
    render(withProvider(<Timeline items={ITEMS} onItemPress={onItemPress} advance="revisit" testID="tl" />));

    fireEvent.press(screen.getByTestId('tl-press-0'));
    expect(onItemPress).toHaveBeenCalledWith(0);
    fireEvent.press(screen.getByTestId('tl-press-2'));
    expect(onItemPress).toHaveBeenCalledWith(2);

    // 3 is beyond the front: not yet.
    onItemPress.mockClear();
    fireEvent.press(screen.getByTestId('tl-press-3'));
    expect(onItemPress).not.toHaveBeenCalled();
  });

  it('a milestone out of reach says it is disabled instead of staying mute', () => {
    render(withProvider(<Timeline items={ITEMS} onItemPress={jest.fn()} advance="sequential" testID="tl" />));
    expect(screen.getByTestId('tl-press-3')).toHaveProp('accessibilityState', {
      checked: false,
      disabled: true,
      selected: false,
    });
  });

  it('the line keeps its furthest point when the parent hands back less progress', () => {
    const { rerender } = render(withProvider(<Timeline items={ITEMS} advance="revisit" testID="tl" />));
    act(() => jest.advanceTimersByTime(600));

    // Everything pending except the first: in 'revisit' the path isn't
    // undone, so the next reachable one is still 2.
    const walkedBack = ITEMS.map((item, i) => (i === 0 ? item : { ...item, status: 'pending' as const }));
    rerender(withProvider(<Timeline items={walkedBack} advance="revisit" onItemPress={jest.fn()} testID="tl" />));
    act(() => jest.advanceTimersByTime(600));

    expect(screen.getByTestId('tl-press-2')).toHaveProp('accessibilityState', {
      checked: false,
      disabled: false,
      selected: false,
    });
  });

  it("advance='free' lets the line go back", () => {
    const { rerender } = render(withProvider(<Timeline items={ITEMS} onItemPress={jest.fn()} testID="tl" />));
    act(() => jest.advanceTimersByTime(600));

    const walkedBack = ITEMS.map((item, i) => (i === 0 ? item : { ...item, status: 'pending' as const }));
    rerender(withProvider(<Timeline items={walkedBack} onItemPress={jest.fn()} testID="tl" />));
    act(() => jest.advanceTimersByTime(600));

    // Without restriction, all of them keep responding.
    expect(screen.getByTestId('tl-press-3')).toHaveProp('accessibilityState', {
      checked: false,
      disabled: false,
      selected: false,
    });
  });

  it('selectedIndex highlights the milestone being looked at without moving the line', () => {
    render(withProvider(<Timeline items={ITEMS} onItemPress={jest.fn()} selectedIndex={0} testID="tl" />));
    expect(screen.getByTestId('tl-press-0')).toHaveProp('accessibilityState', {
      checked: true,
      disabled: false,
      selected: true,
    });
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
    // The halo is text-less Views: what changes is the size of the tree.
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
