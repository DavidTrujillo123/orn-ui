import React from 'react';
import { Modal, Platform, Text } from 'react-native';
import { act, render, screen } from '@testing-library/react-native';
import { UIProvider } from '../UIProvider';
import { NativeOverlay } from '../NativeOverlay';
import { Alert } from '../../organisms/Alert';
import { BottomSheet } from '../../organisms/BottomSheet';

function withProvider(children: React.ReactNode) {
  return <UIProvider mode="light">{children}</UIProvider>;
}

const nativeModals = () => screen.UNSAFE_queryAllByType(Modal);

describe('NativeOverlay (iOS: one native presentation at a time)', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });
  afterEach(() => {
    act(() => jest.runOnlyPendingTimers());
    jest.useRealTimers();
  });

  it('a sibling overlay opened over another is drawn inside it, not as a second native modal', () => {
    render(
      withProvider(
        <>
          <BottomSheet visible onClose={() => {}} title="Sheet">
            <Text>sheet</Text>
          </BottomSheet>
          <Alert visible title="Over the sheet" onClose={() => {}} />
        </>
      )
    );
    expect(screen.getByText('sheet')).toBeOnTheScreen();
    expect(screen.getByText('Over the sheet')).toBeOnTheScreen();
    expect(nativeModals()).toHaveLength(1);
  });

  it('an overlay rendered inside another stays a native modal (iOS presents nested ones)', () => {
    render(
      withProvider(
        <NativeOverlay transparent>
          <Text>outer</Text>
          <NativeOverlay transparent>
            <Text>inner</Text>
          </NativeOverlay>
        </NativeOverlay>
      )
    );
    expect(screen.getByText('inner')).toBeOnTheScreen();
    expect(nativeModals()).toHaveLength(2);
  });

  it('opened while another is closing, it waits for that one to be gone and then presents', () => {
    const { rerender } = render(
      withProvider(
        <NativeOverlay transparent>
          <Text>sheet</Text>
        </NativeOverlay>
      )
    );
    // The first one starts its exit animation and, in the same commit, the
    // second one asks to show.
    rerender(
      withProvider(
        <>
          <NativeOverlay transparent closing>
            <Text>sheet</Text>
          </NativeOverlay>
          <NativeOverlay transparent>
            <Text>alert</Text>
          </NativeOverlay>
        </>
      )
    );
    expect(screen.queryByText('alert')).toBeNull();

    // Exit animation over: the first one unmounts; iOS still needs a moment.
    rerender(
      withProvider(
        <NativeOverlay transparent>
          <Text>alert</Text>
        </NativeOverlay>
      )
    );
    act(() => jest.runOnlyPendingTimers());
    expect(screen.getByText('alert')).toBeOnTheScreen();
    expect(nativeModals()).toHaveLength(1);
  });

  it('on Android every overlay is its own native modal', () => {
    const original = Platform.OS;
    Object.defineProperty(Platform, 'OS', { value: 'android', configurable: true });
    try {
      render(
        withProvider(
          <>
            <NativeOverlay transparent>
              <Text>one</Text>
            </NativeOverlay>
            <NativeOverlay transparent>
              <Text>two</Text>
            </NativeOverlay>
          </>
        )
      );
      expect(nativeModals()).toHaveLength(2);
    } finally {
      Object.defineProperty(Platform, 'OS', { value: original, configurable: true });
    }
  });
});
