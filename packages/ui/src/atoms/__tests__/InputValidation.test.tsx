import React, { createRef } from 'react';
import { AccessibilityInfo } from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { UIProvider } from '../../theme/UIProvider';
import { defaultLabels } from '../../theme/labels';
import { Input, type InputHandle } from '../Input';
import { validateInputValue } from '../inputValidation';

function withProvider(children: React.ReactNode) {
  return <UIProvider mode="light">{children}</UIProvider>;
}

describe('validateInputValue', () => {
  const v = (value: string, opts: Parameters<typeof validateInputValue>[1]) =>
    validateInputValue(value, opts, defaultLabels);

  it('required fails on empty or whitespace only', () => {
    expect(v('  ', { required: true })).toBe('This field is required');
    expect(v('a', { required: true })).toBeUndefined();
  });

  it('an optional empty field is valid: the other rules do not run', () => {
    expect(v('', { rules: { minLength: 5 } })).toBeUndefined();
  });

  it('length, pattern and custom check, in that order, with default or own messages', () => {
    expect(v('ab', { rules: { minLength: 3 } })).toBe('Enter at least 3 characters');
    expect(v('abcd', { rules: { maxLength: { value: 3, message: 'Too long' } } })).toBe('Too long');
    expect(v('abc', { rules: { pattern: /^\d+$/ } })).toBe('Invalid format');
    expect(v('abc', { rules: { validate: (x) => x === 'ok' || 'Must be ok' } })).toBe('Must be ok');
    expect(v('abc', { rules: { validate: () => false } })).toBe('Invalid format');
    expect(v('ok', { rules: { minLength: 2, validate: (x) => x === 'ok' || 'Must be ok' } })).toBeUndefined();
  });

  it('a global regex does not alternate between calls', () => {
    const re = /^\d+$/g;
    expect(v('123', { rules: { pattern: re } })).toBeUndefined();
    expect(v('123', { rules: { pattern: re } })).toBeUndefined();
  });
});

describe('Input validation', () => {
  it('required shows its error on blur and clears it as soon as the value is fixed', () => {
    render(withProvider(<Input label="Email" required testID="email" />));
    const field = screen.getByLabelText('Email, required');

    fireEvent(field, 'focus');
    fireEvent(field, 'blur');
    expect(screen.getByText('This field is required')).toBeOnTheScreen();

    fireEvent.changeText(field, 'a');
    expect(screen.queryByText('This field is required')).toBeNull();
  });

  it('rules run on blur by default, on every change with validateOn="change"', () => {
    const onValidate = jest.fn();
    const { rerender } = render(withProvider(<Input label="Code" rules={{ minLength: 4 }} onValidate={onValidate} />));
    fireEvent.changeText(screen.getByLabelText('Code'), 'ab');
    expect(screen.queryByText('Enter at least 4 characters')).toBeNull();
    fireEvent(screen.getByLabelText('Code'), 'blur');
    expect(screen.getByText('Enter at least 4 characters')).toBeOnTheScreen();
    expect(onValidate).toHaveBeenLastCalledWith('Enter at least 4 characters');

    rerender(withProvider(<Input label="Pin" rules={{ maxLength: 2 }} validateOn="change" key="b" />));
    fireEvent.changeText(screen.getByLabelText('Pin'), 'abc');
    expect(screen.getByText('Enter at most 2 characters')).toBeOnTheScreen();
  });

  it('validateOn="submit" waits for ref.validate()', () => {
    const ref = createRef<InputHandle>();
    render(withProvider(<Input ref={ref} label="Name" required validateOn="submit" />));
    fireEvent(screen.getByLabelText('Name, required'), 'blur');
    expect(screen.queryByText('This field is required')).toBeNull();

    let result: string | undefined;
    act(() => {
      result = ref.current!.validate();
    });
    expect(result).toBe('This field is required');
    expect(screen.getByText('This field is required')).toBeOnTheScreen();
  });

  it('a controlled value is what gets validated', () => {
    const ref = createRef<InputHandle>();
    render(withProvider(<Input ref={ref} label="Name" required value="Ada" onChangeText={() => {}} />));
    act(() => {
      expect(ref.current!.validate()).toBeUndefined();
    });
  });

  it('an explicit error wins over the built-in validation', () => {
    render(withProvider(<Input label="Email" required error="Already taken" />));
    fireEvent(screen.getByLabelText('Email, required'), 'blur');
    expect(screen.getByText('Already taken')).toBeOnTheScreen();
    expect(screen.queryByText('This field is required')).toBeNull();
  });

  it('announces a new error to screen readers', () => {
    const announce = jest.spyOn(AccessibilityInfo, 'announceForAccessibility');
    render(withProvider(<Input label="Email" required />));
    fireEvent(screen.getByLabelText('Email, required'), 'blur');
    expect(announce).toHaveBeenCalledWith('This field is required');
    announce.mockRestore();
  });

  it('error messages come from labels, so they can be translated', () => {
    render(
      <UIProvider mode="light" labels={{ requiredError: 'Campo obligatorio' }}>
        <Input label="Email" required />
      </UIProvider>
    );
    fireEvent(screen.getByLabelText('Email, required'), 'blur');
    expect(screen.getByText('Campo obligatorio')).toBeOnTheScreen();
  });

  it('still forwards onChangeText and the TextInput methods through the ref', () => {
    const onChangeText = jest.fn();
    const ref = createRef<InputHandle>();
    render(withProvider(<Input ref={ref} label="Email" onChangeText={onChangeText} />));
    fireEvent.changeText(screen.getByLabelText('Email'), 'x');
    expect(onChangeText).toHaveBeenCalledWith('x');
    expect(typeof ref.current!.focus).toBe('function');
  });
});
