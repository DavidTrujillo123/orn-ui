import React from 'react';
import { Keyboard, KeyboardAvoidingView, ScrollView, Text } from 'react-native';
import { act, render, screen, fireEvent, within } from '@testing-library/react-native';
import { UIProvider } from '../../theme/UIProvider';
import { BottomSheet } from '../BottomSheet';

function withProvider(children: React.ReactNode) {
  return <UIProvider mode="light">{children}</UIProvider>;
}

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  act(() => jest.runOnlyPendingTimers());
  jest.useRealTimers();
});

describe('BottomSheet', () => {
  it('does not render children when visible is false', () => {
    render(
      withProvider(
        <BottomSheet visible={false} onClose={() => {}}>
          <Text>content</Text>
        </BottomSheet>
      )
    );
    expect(screen.queryByText('content')).not.toBeOnTheScreen();
  });

  it('renders children when visible', () => {
    render(
      withProvider(
        <BottomSheet visible onClose={() => {}}>
          <Text>content</Text>
        </BottomSheet>
      )
    );
    expect(screen.getByText('content')).toBeOnTheScreen();
  });

  it('calls onClose when the backdrop is pressed', () => {
    const onClose = jest.fn();
    render(
      withProvider(
        <BottomSheet visible onClose={onClose}>
          <Text>content</Text>
        </BottomSheet>
      )
    );
    fireEvent.press(screen.getByLabelText('Close'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('renders a header with a close button when given a title', () => {
    const onClose = jest.fn();
    render(
      withProvider(
        <BottomSheet visible onClose={onClose} title="New invoice">
          <Text>content</Text>
        </BottomSheet>
      )
    );
    expect(screen.getByText('New invoice')).toBeOnTheScreen();
    fireEvent.press(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('keeps a single "Close" element: with a header the backdrop stops naming itself', () => {
    render(
      withProvider(
        <BottomSheet visible onClose={() => {}} title="New invoice">
          <Text>content</Text>
        </BottomSheet>
      )
    );
    expect(screen.getAllByLabelText('Close')).toHaveLength(1);
    fireEvent.press(screen.getByTestId('bottom-sheet-backdrop'));
  });

  it('renders the footer outside the scroll', () => {
    render(
      withProvider(
        <BottomSheet visible onClose={() => {}} footer={<Text>footer content</Text>}>
          <Text>content</Text>
        </BottomSheet>
      )
    );
    expect(screen.getByText('footer content')).toBeOnTheScreen();
  });

  it('scrolls its content by default and skips the scroller when asked', () => {
    const { UNSAFE_queryByType, rerender } = render(
      withProvider(
        <BottomSheet visible onClose={() => {}}>
          <Text>content</Text>
        </BottomSheet>
      )
    );
    expect(UNSAFE_queryByType(ScrollView)).not.toBeNull();

    rerender(
      withProvider(
        <BottomSheet visible onClose={() => {}} scrollable={false}>
          <Text>content</Text>
        </BottomSheet>
      )
    );
    expect(UNSAFE_queryByType(ScrollView)).toBeNull();
  });

  it('draggable={false} drops the drag handle', () => {
    const { rerender } = render(
      withProvider(
        <BottomSheet visible onClose={() => {}}>
          <Text>content</Text>
        </BottomSheet>
      )
    );
    expect(screen.getByTestId('bottom-sheet-handle')).toBeOnTheScreen();

    rerender(
      withProvider(
        <BottomSheet visible onClose={() => {}} draggable={false}>
          <Text>content</Text>
        </BottomSheet>
      )
    );
    expect(screen.queryByTestId('bottom-sheet-handle')).not.toBeOnTheScreen();
  });

  it('pushes the whole sheet above the keyboard, and only once', () => {
    const { UNSAFE_getByType } = render(
      withProvider(
        <BottomSheet visible onClose={() => {}} title="Add a note">
          <Text>content</Text>
        </BottomSheet>
      )
    );
    // The sheet lives stuck to the bottom: the keyboard covers it entirely unless it is pushed up.
    expect(UNSAFE_getByType(KeyboardAvoidingView).props.behavior).toBe('padding');
    // Also adjusting the scroll's insets would compensate twice.
    expect(UNSAFE_getByType(ScrollView).props.automaticallyAdjustKeyboardInsets).toBeFalsy();
  });

  it('caps its height against the container, so the keyboard cannot clip it', () => {
    render(
      withProvider(
        <BottomSheet visible onClose={() => {}} testID="sheet" maxHeight={0.5}>
          <Text>content</Text>
        </BottomSheet>
      )
    );
    expect(screen.getByTestId('sheet')).toHaveStyle({ maxHeight: '50%' });
  });

  it('footerPlacement="scroll" moves the footer inside the scroller', () => {
    const { UNSAFE_getByType } = render(
      withProvider(
        <BottomSheet visible onClose={() => {}} footerPlacement="scroll" footer={<Text>footer content</Text>}>
          <Text>content</Text>
        </BottomSheet>
      )
    );
    expect(screen.getByText('footer content')).toBeOnTheScreen();
    expect(within(UNSAFE_getByType(ScrollView)).getByText('footer content')).toBeOnTheScreen();
  });

  it('footerPlacement="fixed" keeps the footer out of the scroller', () => {
    const { UNSAFE_getByType } = render(
      withProvider(
        <BottomSheet visible onClose={() => {}} footer={<Text>footer content</Text>}>
          <Text>content</Text>
        </BottomSheet>
      )
    );
    expect(within(UNSAFE_getByType(ScrollView)).queryByText('footer content')).not.toBeOnTheScreen();
  });

  it('footerPlacement="hide-with-keyboard" gives the row back while typing', () => {
    // Several listen to the same event (the sheet and the root's keyboard
    // host): all are stored and all are fired, as RN does.
    const listeners: Record<string, Array<() => void>> = {};
    const handlers = new Proxy({} as Record<string, () => void>, {
      get: (_, event: string) => () => (listeners[event] ?? []).forEach((h) => h()),
    });
    const addListener = jest
      .spyOn(Keyboard, 'addListener')
      .mockImplementation((event, handler) => {
        (listeners[event] ??= []).push(handler as () => void);
        return { remove: jest.fn() } as never;
      });

    render(
      withProvider(
        <BottomSheet
          visible
          onClose={() => {}}
          footerPlacement="hide-with-keyboard"
          footer={<Text>footer content</Text>}
        >
          <Text>content</Text>
        </BottomSheet>
      )
    );
    expect(screen.getByText('footer content')).toBeOnTheScreen();

    act(() => handlers.keyboardWillShow!());
    expect(screen.queryByText('footer content')).not.toBeOnTheScreen();

    act(() => handlers.keyboardWillHide!());
    expect(screen.getByText('footer content')).toBeOnTheScreen();

    addListener.mockRestore();
  });

  it('unmounts only after the close animation finishes', () => {
    const { rerender } = render(
      withProvider(
        <BottomSheet visible onClose={() => {}}>
          <Text>content</Text>
        </BottomSheet>
      )
    );
    rerender(
      withProvider(
        <BottomSheet visible={false} onClose={() => {}}>
          <Text>content</Text>
        </BottomSheet>
      )
    );
    expect(screen.getByText('content')).toBeOnTheScreen();
    act(() => {
      jest.advanceTimersByTime(300);
    });
    expect(screen.queryByText('content')).not.toBeOnTheScreen();
  });

  it('names the close button from labels', () => {
    render(
      <UIProvider mode="light" labels={{ close: 'Cerrar' }}>
        <BottomSheet visible onClose={() => {}} title="Filters">
          <Text>content</Text>
        </BottomSheet>
      </UIProvider>
    );
    expect(screen.getByRole('button', { name: 'Cerrar' })).toBeOnTheScreen();
  });

  it('a short downward flick closes it, a slow short drag snaps back', () => {
    const { PanResponder } = require('react-native');
    const configs: Array<{ onPanResponderRelease: (e: unknown, g: { dy: number; vy: number }) => void }> = [];
    const spy = jest.spyOn(PanResponder, 'create').mockImplementation(((config: never) => {
      configs.push(config);
      return { panHandlers: {} };
    }) as never);
    const onClose = jest.fn();
    render(
      withProvider(
        <BottomSheet visible onClose={onClose}>
          <Text>content</Text>
        </BottomSheet>
      )
    );
    const release = configs[configs.length - 1]!.onPanResponderRelease;
    act(() => release({}, { dy: 30, vy: 0.1 }));
    expect(onClose).not.toHaveBeenCalled();
    act(() => release({}, { dy: 30, vy: 1.2 }));
    expect(onClose).toHaveBeenCalledTimes(1);
    spy.mockRestore();
  });

  it('inline draws the sheet in place, without a native Modal', () => {
    const { Modal } = require('react-native');
    render(
      withProvider(
        <BottomSheet visible inline onClose={() => {}} title="Filters">
          <Text>content</Text>
        </BottomSheet>
      )
    );
    expect(screen.getByText('content')).toBeOnTheScreen();
    expect(screen.UNSAFE_queryAllByType(Modal)).toHaveLength(0);
  });
});
