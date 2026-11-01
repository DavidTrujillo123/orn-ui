import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { UIProvider } from '../../theme/UIProvider';
import { Checkbox } from '../Checkbox';

function withProvider(children: React.ReactNode) {
  return <UIProvider mode="light">{children}</UIProvider>;
}

describe('Checkbox', () => {
  it('reports its checked state to accessibility', () => {
    render(withProvider(<Checkbox value label="Accept" onValueChange={() => {}} />));
    expect(screen.getByRole('checkbox', { name: 'Accept' })).toBeChecked();
  });

  it('reports unchecked state', () => {
    render(withProvider(<Checkbox value={false} label="Accept" onValueChange={() => {}} />));
    expect(screen.getByRole('checkbox', { name: 'Accept' })).not.toBeChecked();
  });

  it('toggles the value on press', () => {
    const onValueChange = jest.fn();
    render(withProvider(<Checkbox value={false} label="Accept" onValueChange={onValueChange} />));
    fireEvent.press(screen.getByRole('checkbox', { name: 'Accept' }));
    expect(onValueChange).toHaveBeenCalledWith(true);
  });

  it('does not toggle when disabled', () => {
    const onValueChange = jest.fn();
    render(
      withProvider(<Checkbox value={false} label="Accept" onValueChange={onValueChange} disabled />)
    );
    fireEvent.press(screen.getByRole('checkbox', { name: 'Accept' }));
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('does not crash with an empty label', () => {
    render(withProvider(<Checkbox value={false} onValueChange={() => {}} label="" accessibilityLabel="Agree" />));
    expect(screen.getByRole('checkbox', { name: 'Agree' })).toBeOnTheScreen();
  });

  it('accepts an accessibilityLabel when there is no visible label', () => {
    render(withProvider(<Checkbox value onValueChange={() => {}} accessibilityLabel="Select row" />));
    expect(screen.getByRole('checkbox', { name: 'Select row' })).toBeOnTheScreen();
  });

  it('dims the label too when disabled', () => {
    render(withProvider(<Checkbox value onValueChange={() => {}} label="Locked" disabled />));
    expect(screen.getByText('Locked')).toHaveStyle({ color: '#666666' });
  });

  it('the whole row is at least 44pt tall (Fitts)', () => {
    render(withProvider(<Checkbox value onValueChange={() => {}} label="Row" />));
    expect(screen.getByRole('checkbox')).toHaveStyle({ minHeight: 44 });
  });
});

