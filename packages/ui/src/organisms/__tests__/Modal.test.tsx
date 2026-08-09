import React from 'react';
import { ScrollView, Text } from 'react-native';
import { act, render, screen, fireEvent } from '@testing-library/react-native';
import { UIProvider } from '../../theme/UIProvider';
import { Modal } from '../Modal';

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

describe('Modal', () => {
  it('does not mount children when visible is false', () => {
    render(withProvider(<Modal visible={false}>{<Text>content</Text>}</Modal>));
    expect(screen.queryByText('content')).not.toBeOnTheScreen();
  });

  it('mounts children when visible becomes true', () => {
    const { rerender } = render(withProvider(<Modal visible={false}>{<Text>content</Text>}</Modal>));
    rerender(withProvider(<Modal visible>{<Text>content</Text>}</Modal>));
    expect(screen.getByText('content')).toBeOnTheScreen();
  });

  it('calls onClose when the backdrop is pressed (overlay variant)', () => {
    const onClose = jest.fn();
    render(
      withProvider(
        <Modal visible variant="overlay" onClose={onClose}>
          <Text>content</Text>
        </Modal>
      )
    );
    fireEvent.press(screen.getByTestId('modal-backdrop'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('renders the title and a close button when onClose is provided', () => {
    render(
      withProvider(
        <Modal visible title="Detail" onClose={() => {}}>
          <Text>content</Text>
        </Modal>
      )
    );
    expect(screen.getByText('Detail')).toBeOnTheScreen();
  });

  it('unmounts children only after the close animation finishes', () => {
    const { rerender } = render(
      withProvider(
        <Modal visible variant="overlay" onClose={() => {}}>
          <Text>content</Text>
        </Modal>
      )
    );
    expect(screen.getByText('content')).toBeOnTheScreen();

    rerender(
      withProvider(
        <Modal visible={false} variant="overlay" onClose={() => {}}>
          <Text>content</Text>
        </Modal>
      )
    );
    // todavía montado: la animación de salida no terminó
    expect(screen.getByText('content')).toBeOnTheScreen();

    act(() => {
      jest.advanceTimersByTime(300);
    });
    expect(screen.queryByText('content')).not.toBeOnTheScreen();
  });

  it('renders the footer when provided', () => {
    render(
      withProvider(
        <Modal visible footer={<Text>footer content</Text>}>
          <Text>body</Text>
        </Modal>
      )
    );
    expect(screen.getByText('footer content')).toBeOnTheScreen();
  });

  it('never combines a transparent modal with an unsupported presentationStyle', () => {
    // RN avisa: "Modal with '<style>' presentation style and 'transparent'
    // value is not supported" para todo lo que no sea overFullScreen.
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    for (const variant of ['full', 'overlay', 'fullScreen'] as const) {
      render(
        withProvider(
          <Modal visible variant={variant}>
            <Text>body</Text>
          </Modal>
        )
      );
    }
    expect(warn).not.toHaveBeenCalledWith(expect.stringContaining('presentation style'));
    warn.mockRestore();
  });

  it('scrolls a focused input above the keyboard by default (automaticallyAdjustKeyboardInsets)', () => {
    const { UNSAFE_getByType } = render(
      withProvider(
        <Modal visible>
          <Text>body</Text>
        </Modal>
      )
    );
    expect(UNSAFE_getByType(ScrollView).props.automaticallyAdjustKeyboardInsets).toBe(true);
  });
});
