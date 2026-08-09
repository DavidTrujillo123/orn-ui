import React from 'react';
import { Text } from 'react-native';
import { act, render, screen, fireEvent } from '@testing-library/react-native';
import { UIProvider } from '../../theme/UIProvider';
import { Wizard, type WizardStep } from '../Wizard';

const STEPS: WizardStep[] = [
  { label: 'Account', content: <Text>account content</Text> },
  { label: 'Payment', content: <Text>payment content</Text> },
  { label: 'Confirm', content: <Text>confirm content</Text> },
];

function withProvider(children: React.ReactNode) {
  return <UIProvider mode="light">{children}</UIProvider>;
}

describe('Wizard', () => {
  it('shows only the current step content', () => {
    render(withProvider(<Wizard steps={STEPS} />));
    expect(screen.getByText('account content')).toBeOnTheScreen();
    expect(screen.queryByText('payment content')).not.toBeOnTheScreen();
  });

  it('does not animate the first step, and animates the ones it navigates to', () => {
    jest.useFakeTimers();
    const opacity = () => (screen.getByTestId('wizard-step').props.style as { opacity?: number }).opacity;

    render(withProvider(<Wizard steps={STEPS} />));
    expect(opacity()).toBe(1);

    fireEvent.press(screen.getByRole('button', { name: 'Next' }));
    expect(opacity()).toBe(0);

    act(() => jest.advanceTimersByTime(400));
    expect(opacity()).toBe(1);

    jest.useRealTimers();
  });

  it('animated={false} renders the step content without a wrapper', () => {
    render(withProvider(<Wizard steps={STEPS} animated={false} />));
    expect(screen.queryByTestId('wizard-step')).not.toBeOnTheScreen();
    expect(screen.getByText('account content')).toBeOnTheScreen();
  });

  it('hides Back on the first step', () => {
    render(withProvider(<Wizard steps={STEPS} />));
    expect(screen.queryByRole('button', { name: 'Back' })).not.toBeOnTheScreen();
  });

  it('advances with Next', () => {
    render(withProvider(<Wizard steps={STEPS} />));
    fireEvent.press(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByText('payment content')).toBeOnTheScreen();
  });

  it('goes back with Back', () => {
    render(withProvider(<Wizard steps={STEPS} />));
    fireEvent.press(screen.getByRole('button', { name: 'Next' }));
    fireEvent.press(screen.getByRole('button', { name: 'Back' }));
    expect(screen.getByText('account content')).toBeOnTheScreen();
  });

  it('shows Finish on the last step and calls onFinish', () => {
    const onFinish = jest.fn();
    render(withProvider(<Wizard steps={STEPS} onFinish={onFinish} />));
    fireEvent.press(screen.getByRole('button', { name: 'Next' }));
    fireEvent.press(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByRole('button', { name: 'Finish' })).toBeOnTheScreen();
    fireEvent.press(screen.getByRole('button', { name: 'Finish' }));
    expect(onFinish).toHaveBeenCalledTimes(1);
  });

  it('canGoNext=false blocks advancing', () => {
    const blocked: WizardStep[] = [
      { label: 'A', content: <Text>a</Text>, canGoNext: false },
      { label: 'B', content: <Text>b</Text> },
    ];
    render(withProvider(<Wizard steps={blocked} />));
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
    fireEvent.press(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByText('a')).toBeOnTheScreen();
  });

  it('respects a controlled current and reports changes', () => {
    const onStepChange = jest.fn();
    render(withProvider(<Wizard steps={STEPS} current={1} onStepChange={onStepChange} />));
    expect(screen.getByText('payment content')).toBeOnTheScreen();
    fireEvent.press(screen.getByRole('button', { name: 'Next' }));
    // controlado: no avanza solo, sólo notifica
    expect(screen.getByText('payment content')).toBeOnTheScreen();
    expect(onStepChange).toHaveBeenCalledWith(2);
  });

  it('tapping a completed step in the indicator goes back to it', () => {
    render(withProvider(<Wizard steps={STEPS} />));
    fireEvent.press(screen.getByRole('button', { name: 'Next' }));
    fireEvent.press(screen.getByLabelText('Step 1: Account'));
    expect(screen.getByText('account content')).toBeOnTheScreen();
  });

  it('tapping a future step does nothing (would skip validation)', () => {
    render(withProvider(<Wizard steps={STEPS} />));
    fireEvent.press(screen.getByLabelText('Step 3: Confirm'));
    expect(screen.getByText('account content')).toBeOnTheScreen();
  });

  it('supports custom button labels', () => {
    render(withProvider(<Wizard steps={STEPS} nextLabel="Continue" />));
    expect(screen.getByRole('button', { name: 'Continue' })).toBeOnTheScreen();
  });

  it('scrolls its step content by default so a long form cannot overlap the footer', () => {
    render(withProvider(<Wizard steps={STEPS} />));
    const scroll = screen.getByTestId('wizard-content');
    expect(scroll.props.automaticallyAdjustKeyboardInsets).toBe(true);
    expect(scroll.props.keyboardShouldPersistTaps).toBe('handled');
  });

  it('scrollableContent={false} renders the content without a ScrollView', () => {
    render(withProvider(<Wizard steps={STEPS} scrollableContent={false} />));
    expect(screen.queryByTestId('wizard-content')).toBeNull();
  });

  it('renders a vertical indicator when asked', () => {
    render(withProvider(<Wizard steps={STEPS} orientation="vertical" />));
    expect(screen.getByText('account content')).toBeOnTheScreen();
  });
});
