import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { UIProvider } from '../../theme/UIProvider';
import { Input } from '../Input';

function withProvider(children: React.ReactNode) {
  return <UIProvider mode="light">{children}</UIProvider>;
}

describe('Input', () => {
  it('renders the label', () => {
    render(withProvider(<Input label="Email" />));
    expect(screen.getByText('Email')).toBeOnTheScreen();
  });

  it('propagates onChangeText', () => {
    const onChangeText = jest.fn();
    render(withProvider(<Input label="Email" onChangeText={onChangeText} />));
    fireEvent.changeText(screen.getByLabelText('Email'), 'a@b.com');
    expect(onChangeText).toHaveBeenCalledWith('a@b.com');
  });

  it('shows the error message', () => {
    render(withProvider(<Input label="Email" error="Required" />));
    expect(screen.getByText('Required')).toBeOnTheScreen();
  });

  it('does not render an error message when there is none', () => {
    render(withProvider(<Input label="Email" />));
    expect(screen.queryByText(/required/i)).not.toBeOnTheScreen();
  });

  it('masks text by default when isPassword is set', () => {
    render(withProvider(<Input label="Password" isPassword />));
    expect(screen.getByLabelText('Password').props.secureTextEntry).toBe(true);
  });

  it('toggles password visibility when the eye button is pressed', () => {
    render(withProvider(<Input label="Password" isPassword />));
    fireEvent.press(screen.getByRole('button', { name: 'Show password' }));
    expect(screen.getByLabelText('Password').props.secureTextEntry).toBe(false);
    expect(screen.getByRole('button', { name: 'Hide password' })).toBeOnTheScreen();
  });

  it('calls onRightIconPress when the right icon is pressed', () => {
    const onRightIconPress = jest.fn();
    render(
      withProvider(
        <Input label="Search" rightIconName="close" onRightIconPress={onRightIconPress} />
      )
    );
    fireEvent.press(screen.getByRole('button', { name: 'Clear' }));
    expect(onRightIconPress).toHaveBeenCalledTimes(1);
  });

  it('shows a loading indicator instead of the right icon when isLoading', () => {
    render(withProvider(<Input label="Search" rightIconName="close" isLoading />));
    expect(screen.queryByRole('button', { name: 'Clear' })).not.toBeOnTheScreen();
  });
});
