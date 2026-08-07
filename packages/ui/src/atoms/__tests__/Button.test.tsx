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

  it('hides the label and shows a spinner while loading', () => {
    render(withProvider(<Button title="Save" onPress={() => {}} loading testID="btn" />));
    expect(screen.queryByText('Save')).not.toBeOnTheScreen();
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
    // Regresión: con el style en un Animated.View interno, `flex: 1` no
    // llegaba al nodo que ocupa lugar en el layout del padre, el ancho
    // colapsaba y el label desaparecía (botones en fila del Alert).
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
});
