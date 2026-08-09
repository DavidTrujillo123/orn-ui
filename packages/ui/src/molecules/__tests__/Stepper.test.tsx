import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { UIProvider } from '../../theme/UIProvider';
import { Stepper, sanitizeNumeric } from '../Stepper';

function withProvider(children: React.ReactNode) {
  return <UIProvider mode="light">{children}</UIProvider>;
}

function renderStepper(props: Partial<React.ComponentProps<typeof Stepper>> = {}) {
  return render(
    withProvider(
      <Stepper
        value="1"
        onChangeText={() => {}}
        onIncrement={() => {}}
        onDecrement={() => {}}
        testID="stepper"
        {...props}
      />
    )
  );
}

describe('Stepper', () => {
  it('calls onIncrement/onDecrement on the respective buttons', () => {
    const onIncrement = jest.fn();
    const onDecrement = jest.fn();
    renderStepper({ onIncrement, onDecrement });
    fireEvent.press(screen.getByRole('button', { name: 'Increment' }));
    fireEvent.press(screen.getByRole('button', { name: 'Decrement' }));
    expect(onIncrement).toHaveBeenCalledTimes(1);
    expect(onDecrement).toHaveBeenCalledTimes(1);
  });

  it('propagates manual edits via onChangeText', () => {
    const onChangeText = jest.fn();
    renderStepper({ onChangeText });
    fireEvent.changeText(screen.getByLabelText('Quantity'), '5');
    expect(onChangeText).toHaveBeenCalledWith('5');
  });

  describe('layout', () => {
    it.each(['sm', 'md', 'lg'] as const)('%s hugs its content, so nothing empty follows the "+"', (size) => {
      renderStepper({ size });
      expect(screen.getByTestId('stepper')).toHaveStyle({ alignSelf: 'flex-start' });
      expect(screen.getByLabelText('Quantity')).not.toHaveStyle({ flex: 1 });
    });

    it('each size only changes the scale', () => {
      const heightOf = (size: 'sm' | 'lg') => {
        const { getByTestId, unmount } = renderStepper({ size });
        const style = getByTestId('stepper').props.style as { height: number }[];
        const height = style.flat().find((s) => s?.height)!.height;
        unmount();
        return height;
      };
      expect(heightOf('lg')).toBeGreaterThan(heightOf('sm'));
    });

    it('block fills the row and hands the leftover to the input', () => {
      renderStepper({ block: true });
      expect(screen.getByTestId('stepper')).toHaveStyle({ alignSelf: 'stretch' });
      expect(screen.getByLabelText('Quantity')).toHaveStyle({ flex: 1 });
    });

    it('an explicit style wins over the width default', () => {
      renderStepper({ style: { alignSelf: 'center' } });
      expect(screen.getByTestId('stepper')).toHaveStyle({ alignSelf: 'center' });
    });
  });

  describe('editable', () => {
    it('is typable by default, and says so with a field background', () => {
      renderStepper();
      const input = screen.getByLabelText('Quantity');
      expect(input.props.editable).toBe(true);
      expect(input).toHaveStyle({ backgroundColor: '#f5f7fa' });
    });

    it('editable={false} blocks the keyboard and drops the field background', () => {
      renderStepper({ editable: false });
      const input = screen.getByLabelText('Quantity');
      expect(input.props.editable).toBe(false);
      expect(input).not.toHaveStyle({ backgroundColor: '#f5f7fa' });
    });

    it('still steps with the buttons when typing is blocked', () => {
      const onIncrement = jest.fn();
      renderStepper({ editable: false, onIncrement });
      fireEvent.press(screen.getByRole('button', { name: 'Increment' }));
      expect(onIncrement).toHaveBeenCalledTimes(1);
    });

    it('highlights the control while the field has focus', () => {
      renderStepper();
      fireEvent(screen.getByLabelText('Quantity'), 'focus');
      expect(screen.getByTestId('stepper')).toHaveStyle({ borderColor: '#004cef' });
    });
  });

  describe('validation', () => {
    it('drops anything that is not a digit', () => {
      const onChangeText = jest.fn();
      renderStepper({ onChangeText });
      fireEvent.changeText(screen.getByLabelText('Quantity'), '1a2 ');
      expect(onChangeText).toHaveBeenCalledWith('12');
    });

    it('drops the separator unless decimals are allowed', () => {
      const onChangeText = jest.fn();
      const { rerender } = renderStepper({ onChangeText });
      fireEvent.changeText(screen.getByLabelText('Quantity'), '12,5');
      expect(onChangeText).toHaveBeenLastCalledWith('125');

      rerender(
        withProvider(
          <Stepper
            value="1"
            onChangeText={onChangeText}
            onIncrement={() => {}}
            onDecrement={() => {}}
            allowDecimals
          />
        )
      );
      fireEvent.changeText(screen.getByLabelText('Quantity'), '12,5');
      expect(onChangeText).toHaveBeenLastCalledWith('12.5');
    });

    it('keeps a single separator', () => {
      const onChangeText = jest.fn();
      renderStepper({ onChangeText, allowDecimals: true });
      fireEvent.changeText(screen.getByLabelText('Quantity'), '1.2.3');
      expect(onChangeText).toHaveBeenCalledWith('1.23');
    });

    it('rejects the minus sign unless the range reaches below zero', () => {
      const onChangeText = jest.fn();
      const { rerender } = renderStepper({ onChangeText });
      fireEvent.changeText(screen.getByLabelText('Quantity'), '-5');
      expect(onChangeText).toHaveBeenLastCalledWith('5');

      rerender(
        withProvider(
          <Stepper value="1" onChangeText={onChangeText} onIncrement={() => {}} onDecrement={() => {}} min={-10} />
        )
      );
      fireEvent.changeText(screen.getByLabelText('Quantity'), '-5');
      expect(onChangeText).toHaveBeenLastCalledWith('-5');
    });

    it('uses a keyboard without a decimal key unless decimals are allowed', () => {
      const { rerender } = renderStepper();
      expect(screen.getByLabelText('Quantity').props.keyboardType).toBe('number-pad');

      rerender(
        withProvider(
          <Stepper value="1" onChangeText={() => {}} onIncrement={() => {}} onDecrement={() => {}} allowDecimals />
        )
      );
      expect(screen.getByLabelText('Quantity').props.keyboardType).toBe('decimal-pad');
    });

    it('clamps to the range on blur, not while typing', () => {
      const onChangeText = jest.fn();
      renderStepper({ value: '99', onChangeText, min: 1, max: 10 });
      expect(onChangeText).not.toHaveBeenCalled();

      fireEvent(screen.getByLabelText('Quantity'), 'blur');
      expect(onChangeText).toHaveBeenCalledWith('10');
    });

    it('leaves an in-range value alone on blur', () => {
      const onChangeText = jest.fn();
      renderStepper({ value: '5', onChangeText, min: 1, max: 10 });
      fireEvent(screen.getByLabelText('Quantity'), 'blur');
      expect(onChangeText).not.toHaveBeenCalled();
    });

    it('leaves an empty field alone on blur', () => {
      const onChangeText = jest.fn();
      renderStepper({ value: '', onChangeText, min: 1 });
      fireEvent(screen.getByLabelText('Quantity'), 'blur');
      expect(onChangeText).not.toHaveBeenCalled();
    });

    it('disables the button that would leave the range', () => {
      const onDecrement = jest.fn();
      renderStepper({ value: '0', min: 0, max: 10, onDecrement });
      expect(screen.getByRole('button', { name: 'Decrement' })).toBeDisabled();
      expect(screen.getByRole('button', { name: 'Increment' })).not.toBeDisabled();

      fireEvent.press(screen.getByRole('button', { name: 'Decrement' }));
      expect(onDecrement).not.toHaveBeenCalled();
    });

    it('disables "+" at the maximum', () => {
      renderStepper({ value: '10', min: 0, max: 10 });
      expect(screen.getByRole('button', { name: 'Increment' })).toBeDisabled();
    });

    it('keeps both buttons live without a range', () => {
      renderStepper({ value: '0' });
      expect(screen.getByRole('button', { name: 'Decrement' })).not.toBeDisabled();
      expect(screen.getByRole('button', { name: 'Increment' })).not.toBeDisabled();
    });
  });
});

describe('sanitizeNumeric', () => {
  it('keeps digits only by default', () => {
    expect(sanitizeNumeric('-1a2,3')).toBe('123');
  });

  it('normalizes the comma and keeps one dot when decimals are allowed', () => {
    expect(sanitizeNumeric('1,5', { allowDecimals: true })).toBe('1.5');
    expect(sanitizeNumeric('1.5.7', { allowDecimals: true })).toBe('1.57');
  });

  it('keeps a leading minus only when negatives are allowed', () => {
    expect(sanitizeNumeric('-4', { allowNegative: true })).toBe('-4');
    expect(sanitizeNumeric('4-2', { allowNegative: true })).toBe('42');
  });
});
