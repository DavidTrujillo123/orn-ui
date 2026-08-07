import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { UIProvider } from '../../theme/UIProvider';
import { Steps } from '../Steps';

const STEPS = [
  { label: 'Account', description: 'Your details' },
  { label: 'Payment' },
  { label: 'Confirm' },
];

function withProvider(children: React.ReactNode) {
  return <UIProvider mode="light">{children}</UIProvider>;
}

describe('Steps', () => {
  it('renders every step label', () => {
    render(withProvider(<Steps steps={STEPS} current={0} />));
    expect(screen.getByText('Account')).toBeOnTheScreen();
    expect(screen.getByText('Payment')).toBeOnTheScreen();
    expect(screen.getByText('Confirm')).toBeOnTheScreen();
  });

  it('renders step descriptions when present', () => {
    render(withProvider(<Steps steps={STEPS} current={0} />));
    expect(screen.getByText('Your details')).toBeOnTheScreen();
  });

  it('marks the current step as selected for accessibility', () => {
    render(withProvider(<Steps steps={STEPS} current={1} />));
    expect(screen.getByLabelText('Step 2: Payment').props.accessibilityState.selected).toBe(true);
    expect(screen.getByLabelText('Step 1: Account').props.accessibilityState.selected).toBe(false);
  });

  it('completedIndicator="number" keeps showing numbers on completed steps', () => {
    render(withProvider(<Steps steps={STEPS} current={2} completedIndicator="number" />));
    expect(screen.getByText('1')).toBeOnTheScreen();
    expect(screen.getByText('2')).toBeOnTheScreen();
  });

  it('completedIndicator="check" replaces the number on completed steps', () => {
    render(withProvider(<Steps steps={STEPS} current={2} completedIndicator="check" />));
    // el paso actual (3) sigue mostrando su número; los completados, no
    expect(screen.getByText('3')).toBeOnTheScreen();
    expect(screen.queryByText('1')).not.toBeOnTheScreen();
  });

  it('renders in vertical orientation', () => {
    render(withProvider(<Steps steps={STEPS} current={0} orientation="vertical" />));
    expect(screen.getByText('Account')).toBeOnTheScreen();
    expect(screen.getByText('Confirm')).toBeOnTheScreen();
  });

  it('is not pressable without onStepPress', () => {
    render(withProvider(<Steps steps={STEPS} current={0} />));
    expect(screen.getByLabelText('Step 1: Account').props.accessibilityRole).toBe('text');
  });

  it('reports the pressed index when onStepPress is given', () => {
    const onStepPress = jest.fn();
    render(withProvider(<Steps steps={STEPS} current={2} onStepPress={onStepPress} />));
    fireEvent.press(screen.getByLabelText('Step 1: Account'));
    expect(onStepPress).toHaveBeenCalledWith(0);
  });
});
