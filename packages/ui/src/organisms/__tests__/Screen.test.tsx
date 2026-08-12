import React from 'react';
import { KeyboardAvoidingView, ScrollView, Text } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { UIProvider } from '../../theme/UIProvider';
import { Screen } from '../Screen';

function withProvider(children: React.ReactNode) {
  return <UIProvider mode="light">{children}</UIProvider>;
}

describe('Screen', () => {
  it('renders its children when scrollable', () => {
    render(
      withProvider(
        <Screen>
          <Text>content</Text>
        </Screen>
      )
    );
    expect(screen.getByText('content')).toBeOnTheScreen();
  });

  it('renders its children when not scrollable', () => {
    render(
      withProvider(
        <Screen scrollable={false}>
          <Text>content</Text>
        </Screen>
      )
    );
    expect(screen.getByText('content')).toBeOnTheScreen();
  });

  it('renders with only the top edge applied', () => {
    render(
      withProvider(
        <Screen edges={['top']} scrollable={false}>
          <Text>content</Text>
        </Screen>
      )
    );
    expect(screen.getByText('content')).toBeOnTheScreen();
  });

  it('renders with no edges applied', () => {
    render(
      withProvider(
        <Screen edges={[]}>
          <Text>content</Text>
        </Screen>
      )
    );
    expect(screen.getByText('content')).toBeOnTheScreen();
  });

  it('wraps content in a KeyboardAvoidingView by default', () => {
    const { UNSAFE_queryByType } = render(
      withProvider(
        <Screen scrollable={false}>
          <Text>content</Text>
        </Screen>
      )
    );
    expect(UNSAFE_queryByType(KeyboardAvoidingView)).not.toBeNull();
  });

  it('skips the KeyboardAvoidingView when scrollable on iOS, so the keyboard is compensated once', () => {
    const { UNSAFE_queryByType } = render(
      withProvider(
        <Screen>
          <Text>content</Text>
        </Screen>
      )
    );
    expect(UNSAFE_queryByType(KeyboardAvoidingView)).toBeNull();
  });

  it('keyboardAvoiding={false} skips it, so a self-managing child does not double-compensate', () => {
    const { UNSAFE_queryByType } = render(
      withProvider(
        <Screen scrollable={false} keyboardAvoiding={false}>
          <Text>content</Text>
        </Screen>
      )
    );
    expect(UNSAFE_queryByType(KeyboardAvoidingView)).toBeNull();
    expect(screen.getByText('content')).toBeOnTheScreen();
  });

  it('scrolls a focused input above the keyboard by default (automaticallyAdjustKeyboardInsets)', () => {
    const { UNSAFE_getByType } = render(
      withProvider(
        <Screen>
          <Text>content</Text>
        </Screen>
      )
    );
    expect(UNSAFE_getByType(ScrollView).props.automaticallyAdjustKeyboardInsets).toBe(true);
  });

  it('does not set contentInsetAdjustmentBehavior, so iOS does not double-apply the top inset on top of paddingTop', () => {
    const { UNSAFE_getByType } = render(
      withProvider(
        <Screen>
          <Text>content</Text>
        </Screen>
      )
    );
    expect(UNSAFE_getByType(ScrollView).props.contentInsetAdjustmentBehavior).toBeUndefined();
  });

  it('applies the bottom inset to the scroll content on every platform, not just Android', () => {
    const { UNSAFE_getByType } = render(
      <UIProvider mode="light" insets={{ top: 1, bottom: 2, left: 0, right: 0 }}>
        <Screen>
          <Text>content</Text>
        </Screen>
      </UIProvider>
    );
    const style = UNSAFE_getByType(ScrollView).props.contentContainerStyle;
    const flat = Array.isArray(style) ? Object.assign({}, ...style.flat(Infinity).filter(Boolean)) : style;
    expect(flat.paddingBottom).toBe(2);
  });
});
