import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { UIProvider } from '../../theme/UIProvider';
import { Button } from '../Button';

function withProvider(children: React.ReactNode) {
  return <UIProvider mode="light">{children}</UIProvider>;
}

describe('Button', () => {
  it('renders the title', () => {
    render(withProvider(<Button title="Save" onPress={() => {}} />));
    expect(screen.getByText('Save')).toBeOnTheScreen();
  });

  it('is reachable by accessibility role and label', () => {
    render(withProvider(<Button title="Save" onPress={() => {}} />));
    expect(screen.getByRole('button', { name: 'Save' })).toBeOnTheScreen();
  });

  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    render(withProvider(<Button title="Save" onPress={onPress} />));
    fireEvent.press(screen.getByRole('button', { name: 'Save' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress when disabled', () => {
    const onPress = jest.fn();
    render(withProvider(<Button title="Save" onPress={onPress} disabled />));
    fireEvent.press(screen.getByRole('button', { name: 'Save' }));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('does not call onPress while loading', () => {
    const onPress = jest.fn();
    render(withProvider(<Button title="Save" onPress={onPress} loading />));
    fireEvent.press(screen.getByRole('button', { name: 'Save' }));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('exposes accessibilityState.disabled when disabled', () => {
    render(withProvider(<Button title="Save" onPress={() => {}} disabled />));
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
  });

  it('keeps the label in place but invisible while loading, so the width does not jump', () => {
    const { ActivityIndicator } = require('react-native');
    render(withProvider(<Button title="Save" onPress={() => {}} loading testID="btn" />));
    expect(screen.getByText('Save')).toHaveStyle({ opacity: 0 });
    expect(screen.UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
  });

  it.each([
    ['sm', 'primary', { top: 8, bottom: 8 }],
    ['md', 'link', { top: 12, bottom: 12, left: 8, right: 8 }],
  ] as const)('size %s / variant %s extends its touch area to reach 44pt (Fitts)', (size, variant, slop) => {
    render(withProvider(<Button title="Go" size={size} variant={variant} onPress={() => {}} testID="btn" />));
    expect(screen.getByTestId('btn').props.hitSlop).toEqual(slop);
  });

  it('md and lg need no extra touch area', () => {
    render(withProvider(<Button title="Go" onPress={() => {}} testID="btn" />));
    expect(screen.getByTestId('btn').props.hitSlop).toBeUndefined();
  });

  it('separates a custom leftIcon from the label like a named icon', () => {
    const { Text } = require('react-native');
    render(withProvider(<Button title="Save" onPress={() => {}} leftIcon={<Text testID="custom">*</Text>} />));
    expect(screen.getByTestId('custom').parent?.parent).toHaveStyle({ marginRight: 8 });
  });

  it('renders a custom leftIcon node', () => {
    const { Text } = require('react-native');
    render(
      withProvider(
        <Button title="Save" onPress={() => {}} leftIcon={<Text testID="custom">*</Text>} />
      )
    );
    expect(screen.getByTestId('custom')).toBeOnTheScreen();
  });

  it('applies a consumer-provided layout style to the pressable root, not an inner wrapper', () => {
    // Regression: with the style on an inner Animated.View, `flex: 1` didn't
    // reach the node that takes up space in the parent's layout, the width
    // collapsed and the label disappeared (the Alert's row of buttons).
    render(withProvider(<Button title="Save" onPress={() => {}} style={{ flex: 1 }} />));
    expect(screen.getByRole('button', { name: 'Save' })).toHaveStyle({ flex: 1 });
  });

  it.each(['primary', 'secondary', 'outline', 'ghost', 'link', 'destructive'] as const)(
    'renders the %s variant without crashing',
    (variant) => {
      render(withProvider(<Button title="Save" onPress={() => {}} variant={variant} />));
      expect(screen.getByText('Save')).toBeOnTheScreen();
    }
  );

  it('disabled is not faded on top of its muted colors (figure/ground)', () => {
    render(withProvider(<Button title="Go" disabled onPress={() => {}} testID="btn" />));
    expect(screen.getByTestId('btn')).toHaveStyle({ opacity: 1 });
  });

  it.each([
    ['md', 16],
    ['lg', 20],
  ] as const)('size %s pads with a spacing token (%ipt)', (size, padding) => {
    render(withProvider(<Button title="Go" size={size} onPress={() => {}} testID="btn" />));
    expect(screen.getByTestId('btn')).toHaveStyle({ paddingVertical: padding });
  });
});

