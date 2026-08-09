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
    // La hoja vive pegada abajo: el teclado la tapa entera si no se la empuja.
    expect(UNSAFE_getByType(KeyboardAvoidingView).props.behavior).toBe('padding');
    // Ajustar además los insets del scroll compensaría dos veces.
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
    const handlers: Record<string, () => void> = {};
    const addListener = jest
      .spyOn(Keyboard, 'addListener')
      .mockImplementation((event, handler) => {
        handlers[event] = handler as () => void;
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
});
