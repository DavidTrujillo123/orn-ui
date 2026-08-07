import React from 'react';
import { Text } from 'react-native';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { UIProvider } from '../../theme/UIProvider';
import { IconButton } from '../IconButton';

function withProvider(children: React.ReactNode) {
  return <UIProvider mode="light">{children}</UIProvider>;
}

describe('IconButton', () => {
  it('is reachable by accessibility label', () => {
    render(withProvider(<IconButton iconName="close" accessibilityLabel="Close" onPress={() => {}} />));
    expect(screen.getByRole('button', { name: 'Close' })).toBeOnTheScreen();
  });

  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    render(withProvider(<IconButton iconName="close" accessibilityLabel="Close" onPress={onPress} />));
    fireEvent.press(screen.getByRole('button', { name: 'Close' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress when disabled', () => {
    const onPress = jest.fn();
    render(
      withProvider(<IconButton iconName="close" accessibilityLabel="Close" onPress={onPress} disabled />)
    );
    fireEvent.press(screen.getByRole('button', { name: 'Close' }));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('renders a custom icon node over iconName', () => {
    render(
      withProvider(
        <IconButton
          icon={<Text testID="custom">x</Text>}
          iconName="close"
          accessibilityLabel="Close"
          onPress={() => {}}
        />
      )
    );
    expect(screen.getByTestId('custom')).toBeOnTheScreen();
  });
});
