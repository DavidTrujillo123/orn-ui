import React from 'react';
import { Text } from 'react-native';
import { act, render, screen, fireEvent } from '@testing-library/react-native';
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
