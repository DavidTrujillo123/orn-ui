import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { UIProvider } from '../../theme/UIProvider';
import { Select } from '../Select';

const OPTIONS = [
  { label: 'Cash', value: 'cash' },
  { label: 'Card', value: 'card' },
];

function withProvider(children: React.ReactNode) {
  return <UIProvider mode="light">{children}</UIProvider>;
}

describe('Select', () => {
  it('shows the placeholder when nothing is selected', () => {
    render(withProvider(<Select label="Payment" options={OPTIONS} selectedValue={undefined} onSelect={() => {}} />));
    expect(screen.getByText('Select...')).toBeOnTheScreen();
  });

  it('shows the label of the selected option', () => {
    render(withProvider(<Select label="Payment" options={OPTIONS} selectedValue="cash" onSelect={() => {}} />));
    expect(screen.getByText('Cash')).toBeOnTheScreen();
  });

  it('opens the option list on press and closes after selecting', () => {
    render(withProvider(<Select label="Payment" options={OPTIONS} selectedValue={undefined} onSelect={() => {}} />));
    fireEvent.press(screen.getByRole('button', { name: 'Payment' }));
    expect(screen.getByRole('menuitem', { name: 'Card' })).toBeOnTheScreen();
    fireEvent.press(screen.getByRole('menuitem', { name: 'Card' }));
    expect(screen.queryByRole('menuitem', { name: 'Card' })).not.toBeOnTheScreen();
  });

  it('calls onSelect with the chosen value', () => {
    const onSelect = jest.fn();
    render(withProvider(<Select label="Payment" options={OPTIONS} selectedValue={undefined} onSelect={onSelect} />));
    fireEvent.press(screen.getByRole('button', { name: 'Payment' }));
    fireEvent.press(screen.getByRole('menuitem', { name: 'Card' }));
    expect(onSelect).toHaveBeenCalledWith('card');
  });

  it('marks the active option as selected', () => {
    render(withProvider(<Select label="Payment" options={OPTIONS} selectedValue="card" onSelect={() => {}} />));
    fireEvent.press(screen.getByRole('button', { name: 'Payment' }));
    expect(screen.getByRole('menuitem', { name: 'Card' }).props.accessibilityState.selected).toBe(true);
  });

  it('disables opening while isLoading', () => {
    render(
      withProvider(
        <Select label="Payment" options={OPTIONS} selectedValue={undefined} onSelect={() => {}} isLoading />
      )
    );
    fireEvent.press(screen.getByRole('button', { name: 'Payment' }));
    expect(screen.queryByRole('menuitem', { name: 'Card' })).not.toBeOnTheScreen();
  });

  it('shows a required marker when required is set', () => {
    render(withProvider(<Select label="Payment" required options={OPTIONS} selectedValue={undefined} onSelect={() => {}} />));
    expect(screen.getByText(/\*/)).toBeOnTheScreen();
  });

  it('falls back to the placeholder prop for the accessibility label when there is no label', () => {
    render(
      withProvider(
        <Select options={OPTIONS} selectedValue={undefined} onSelect={() => {}} placeholder="Choose one" />
      )
    );
    expect(screen.getByRole('button', { name: 'Choose one' })).toBeOnTheScreen();
  });

  it('shows the error message', () => {
    render(
      withProvider(
        <Select label="Payment" options={OPTIONS} selectedValue={undefined} onSelect={() => {}} error="Required" />
      )
    );
    expect(screen.getByText('Required')).toBeOnTheScreen();
  });
});
