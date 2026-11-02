import React from 'react';
import { Animated, Text } from 'react-native';
import { act, render, screen } from '@testing-library/react-native';
import { UIProvider } from '../../theme/UIProvider';
import { Transition } from '../Transition';

function withProvider(children: React.ReactNode) {
  return <UIProvider mode="light">{children}</UIProvider>;
}

// Each transition is an Animated that finishes through timers; without fake
// timers the exit callback runs after the test, against an unmounted tree.
const flush = () => act(() => jest.runOnlyPendingTimers());
// Animated chains frames: each one schedules the next, so the clock has to
// run past the duration instead of flushing the pending timers.
const settle = () => act(() => jest.advanceTimersByTime(400));

describe('Transition', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => {
    flush();
    jest.useRealTimers();
  });

  it('renders its children when visible', () => {
    render(withProvider(<Transition>{<Text>content</Text>}</Transition>));
    expect(screen.getByText('content')).toBeOnTheScreen();
  });

  it('renders nothing when it starts hidden', () => {
    render(
      withProvider(
        <Transition visible={false}>
          <Text>content</Text>
        </Transition>
      )
    );
    expect(screen.queryByText('content')).not.toBeOnTheScreen();
  });

  it('keeps the children mounted until the exit animation finishes', () => {
    const onExited = jest.fn();
    const { rerender } = render(
      withProvider(
        <Transition onExited={onExited}>
          <Text>content</Text>
        </Transition>
      )
    );

    rerender(
      withProvider(
        <Transition visible={false} onExited={onExited}>
          <Text>content</Text>
        </Transition>
      )
    );
    // Exiting: still mounted, but already out of the accessibility tree.
    expect(screen.getByText('content', { includeHiddenElements: true })).toBeOnTheScreen();
    expect(screen.queryByText('content')).toBeNull();

    settle();
    expect(onExited).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('content', { includeHiddenElements: true })).not.toBeOnTheScreen();
  });

  it('keepMounted hides the children instead of unmounting them', () => {
    const { rerender } = render(
      withProvider(
        <Transition keepMounted testID="t">
          <Text>content</Text>
        </Transition>
      )
    );

    rerender(
      withProvider(
        <Transition visible={false} keepMounted testID="t">
          <Text>content</Text>
        </Transition>
      )
    );
    settle();

    // Hidden but mounted: it receives no touches and the screen reader doesn't read it.
    expect(screen.queryByText('content')).toBeNull();
    const node = screen.getByTestId('t', { includeHiddenElements: true });
    expect(node).toHaveStyle({ pointerEvents: 'none' });
    expect(node).toHaveProp('importantForAccessibility', 'no-hide-descendants');
    expect(screen.getByText('content', { includeHiddenElements: true })).toBeTruthy();
  });

  it('does not replay the enter animation (nor onEntered) when the theme changes', () => {
    const onEntered = jest.fn();
    const tree = (mode: 'light' | 'dark') => (
      <UIProvider mode={mode}>
        <Transition onEntered={onEntered}>
          <Text>content</Text>
        </Transition>
      </UIProvider>
    );
    render(tree('light'));
    settle();
    screen.rerender(tree('dark'));
    settle();
    expect(onEntered).toHaveBeenCalledTimes(1);
  });

  it('reports the end of the enter animation', () => {
    const onEntered = jest.fn();
    render(
      withProvider(
        <Transition visible={false} onEntered={onEntered}>
          <Text>content</Text>
        </Transition>
      )
    );
    settle();

    screen.rerender(
      withProvider(
        <Transition onEntered={onEntered}>
          <Text>content</Text>
        </Transition>
      )
    );
    settle();

    expect(onEntered).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['fade'],
    ['scale'],
    ['pop'],
    ['slide-up'],
    ['slide-down'],
    ['slide-left'],
    ['slide-right'],
  ] as const)('renders the %s preset', (preset) => {
    render(
      withProvider(
        <Transition preset={preset}>
          <Text>content</Text>
        </Transition>
      )
    );
    expect(screen.getByText('content')).toBeOnTheScreen();
  });

  it('animates the first render, and skips it with appear={false}', () => {
    const opacityOf = (testID: string) => (screen.getByTestId(testID).props.style as { opacity: number }).opacity;

    render(
      withProvider(
        <>
          <Transition testID="animated">
            <Text>a</Text>
          </Transition>
          <Transition appear={false} testID="settled">
            <Text>b</Text>
          </Transition>
        </>
      )
    );

    expect(opacityOf('animated')).toBe(0);
    expect(opacityOf('settled')).toBe(1);

    settle();
    expect(opacityOf('animated')).toBe(1);
  });

  it('combines several presets', () => {
    render(
      withProvider(
        <Transition preset={['fade', 'slide-up']}>
          <Text>content</Text>
        </Transition>
      )
    );
    expect(screen.getByText('content')).toBeOnTheScreen();
  });

  it('an external value leaves the children mounted and the progress to the caller', () => {
    const value = new Animated.Value(0);
    render(
      withProvider(
        <Transition value={value} visible={false} keepMounted>
          <Text>content</Text>
        </Transition>
      )
    );
    settle();
    expect(screen.getByText('content', { includeHiddenElements: true })).toBeOnTheScreen();
  });
});
