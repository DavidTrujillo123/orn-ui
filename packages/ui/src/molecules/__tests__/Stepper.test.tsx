import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { UIProvider } from '../../theme/UIProvider';
import { Stepper } from '../Stepper';

function withProvider(children: React.ReactNode) {
  return <UIProvider mode="light">{children}</UIProvider>;
}

describe('Stepper', () => {
  it('calls onIncrement/onDecrement on the respective buttons', () => {
    const onIncrement = jest.fn();
    const onDecrement = jest.fn();
    render(
      withProvider(
        <Stepper value="1" onChangeText={() => {}} onIncrement={onIncrement} onDecrement={onDecrement} />
      )
    );
    fireEvent.press(screen.getByRole('button', { name: 'Increment' }));
    fireEvent.press(screen.getByRole('button', { name: 'Decrement' }));
    expect(onIncrement).toHaveBeenCalledTimes(1);
    expect(onDecrement).toHaveBeenCalledTimes(1);
  });

  it('renders the sm size without crashing', () => {
    render(
      withProvider(
        <Stepper value="1" onChangeText={() => {}} onIncrement={() => {}} onDecrement={() => {}} size="sm" />
      )
    );
    expect(screen.getByLabelText('Quantity')).toBeOnTheScreen();
  });

  it('propagates manual edits via onChangeText', () => {
    const onChangeText = jest.fn();
    render(
      withProvider(
        <Stepper value="1" onChangeText={onChangeText} onIncrement={() => {}} onDecrement={() => {}} />
      )
    );
    fireEvent.changeText(screen.getByLabelText('Quantity'), '5');
    expect(onChangeText).toHaveBeenCalledWith('5');
  });
});
