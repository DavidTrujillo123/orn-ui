import React, { useEffect } from 'react';
import { Keyboard, Text } from 'react-native';
import { act, render, screen } from '@testing-library/react-native';
import { UIProvider } from '../UIProvider';
import { Screen } from '../../organisms/Screen';
import { NavigationBar } from '../../organisms/NavigationBar';
import { Platform } from 'react-native';
import {
  KeyboardHandled,
  computeKeyboardOffset,
  useKeyboardHost,
  type KeyboardField,
  type KeyboardHost,
} from '../KeyboardAvoidance';

describe('computeKeyboardOffset', () => {
  const base = { current: 0, margin: 12, topLimit: 47 };

  it('moves up exactly enough for the field plus the margin', () => {
    // field 700..780, keyboard from 600: 780 + 12 - 600 = 192
    expect(computeKeyboardOffset({ ...base, fieldY: 700, fieldHeight: 80, keyboardTop: 600 })).toBe(-192);
  });

  it('does not move a field that is already visible', () => {
    expect(computeKeyboardOffset({ ...base, fieldY: 200, fieldHeight: 80, keyboardTop: 600 })).toBe(0);
  });

  it('measures against the position without the current offset', () => {
    // Already shifted -192: measured at 508, its original spot is 700.
    expect(computeKeyboardOffset({ ...base, current: -192, fieldY: 508, fieldHeight: 80, keyboardTop: 600 })).toBe(-192);
    // With another field further up, it moves back toward 0.
    expect(computeKeyboardOffset({ ...base, current: -192, fieldY: 108, fieldHeight: 80, keyboardTop: 600 })).toBe(0);
  });

  it('keeps the top of a very tall field below the safe area', () => {
    // 700 tall, more than the gap above the keyboard: seeing the top edge wins (topLimit 47).
    expect(computeKeyboardOffset({ ...base, fieldY: 500, fieldHeight: 700, keyboardTop: 600 })).toBe(47 - 500);
  });
});

describe('keyboard host', () => {
  const listeners: Record<string, Array<(e: unknown) => void>> = {};
  beforeEach(() => {
    jest.useFakeTimers();
    for (const k of Object.keys(listeners)) delete listeners[k];
    jest.spyOn(Keyboard, 'addListener').mockImplementation((event, handler) => {
      (listeners[event] ??= []).push(handler as (e: unknown) => void);
      return { remove: jest.fn() } as never;
    });
  });
  afterEach(() => {
    act(() => jest.runOnlyPendingTimers());
    jest.useRealTimers();
    jest.restoreAllMocks();
  });
  const emit = (event: string, e: unknown) => act(() => (listeners[event] ?? []).forEach((h) => h(e)));

  let captured: KeyboardHost | null = null;
  function Capture() {
    const host = useKeyboardHost();
    useEffect(() => {
      captured = host;
    });
    return <Text>field</Text>;
  }

  const field: KeyboardField = { measure: () => Promise.resolve({ y: 700, height: 80 }) };

  it('moves the whole app up while the keyboard covers the focused field, and back on hide', async () => {
    const { toJSON } = render(
      <UIProvider mode="light" insets={{ top: 47, bottom: 34, left: 0, right: 0 }}>
        <Capture />
      </UIProvider>
    );
    const rootTranslate = () => (toJSON() as any).props.style.transform[0].translateY;

    act(() => captured!.focus(field));
    emit('keyboardWillShow', { endCoordinates: { screenY: 600 }, duration: 250 });
    await act(async () => {});
    act(() => jest.advanceTimersByTime(400));
    // spacing.md (12) of room: 780 + 12 - 600
    expect(rootTranslate()).toBe(-192);

    emit('keyboardWillHide', { endCoordinates: { screenY: 900 }, duration: 250 });
    act(() => jest.advanceTimersByTime(400));
    expect(rootTranslate()).toBe(0);
  });

  it('containers that handle the keyboard themselves expose no host', () => {
    render(
      <UIProvider mode="light">
        <KeyboardHandled>
          <Capture />
        </KeyboardHandled>
      </UIProvider>
    );
    expect(captured).toBeNull();
  });

  it('keyboardAvoidance={false} turns it off', () => {
    render(
      <UIProvider mode="light" keyboardAvoidance={false}>
        <Capture />
      </UIProvider>
    );
    expect(captured).toBeNull();
    expect(screen.getByText('field')).toBeOnTheScreen();
  });

  it('inside a Screen only the content moves: the root and the header stay put', async () => {
    const { toJSON } = render(
      <UIProvider mode="light" insets={{ top: 47, bottom: 34, left: 0, right: 0 }}>
        <Screen scrollable={false} header={<Text>Back</Text>}>
          <Capture />
        </Screen>
      </UIProvider>
    );
    // The host that sees the field is the Screen's, not the root's.
    const screenHost = captured;
    act(() => screenHost!.focus(field));
    emit('keyboardWillShow', { endCoordinates: { screenY: 600 }, duration: 250 });
    await act(async () => {});
    // The area's measureInWindow doesn't respond under jest: its wait expires (100 ms).
    await act(async () => {
      jest.advanceTimersByTime(150);
    });
    act(() => jest.advanceTimersByTime(400));

    const root = toJSON() as any;
    expect(root.props.style.transform[0].translateY).toBe(0);
    const translates: number[] = [];
    const walk = (node: any) => {
      if (!node || typeof node === 'string') return;
      const t = [node.props?.style].flat(3).find((x: any) => x?.transform)?.transform?.[0]?.translateY;
      if (typeof t === 'number') translates.push(t);
      (node.children ?? []).forEach(walk);
    };
    walk(root);
    // root at 0, Screen's area shifted
    expect(translates.filter((t) => t < 0)).toHaveLength(1);
    expect(screen.getByText('Back')).toBeOnTheScreen();
  });

  it('NavigationBar hides while the keyboard is open on Android', () => {
    const os = Platform.OS;
    Object.defineProperty(Platform, 'OS', { get: () => 'android', configurable: true });
    try {
      render(
        <UIProvider mode="light">
          <NavigationBar items={[{ key: 'a', label: 'Atoms' }]} activeKey="a" onChange={() => {}} />
        </UIProvider>
      );
      expect(screen.getByText('Atoms')).toBeOnTheScreen();
      emit('keyboardDidShow', { endCoordinates: { screenY: 500 } });
      expect(screen.queryByText('Atoms')).toBeNull();
      emit('keyboardDidHide', undefined);
      expect(screen.getByText('Atoms')).toBeOnTheScreen();
    } finally {
      Object.defineProperty(Platform, 'OS', { get: () => os, configurable: true });
    }
  });
});
