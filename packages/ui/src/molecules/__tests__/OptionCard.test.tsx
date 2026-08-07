import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { UIProvider } from '../../theme/UIProvider';
import { OptionCard } from '../OptionCard';

function withProvider(children: React.ReactNode) {
  return <UIProvider mode="light">{children}</UIProvider>;
}

describe('OptionCard', () => {
  it('reflects isSelected in accessibilityState.selected', () => {
    render(withProvider(<OptionCard label="Cash" iconName="check" isSelected onPress={() => {}} />));
    expect(screen.getByRole('button', { name: 'Cash' }).props.accessibilityState.selected).toBe(true);
  });

  it('calls onPress', () => {
    const onPress = jest.fn();
    render(withProvider(<OptionCard label="Cash" iconName="check" isSelected={false} onPress={onPress} />));
    fireEvent.press(screen.getByRole('button', { name: 'Cash' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
