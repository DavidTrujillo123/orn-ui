import React from 'react';
import { StyleSheet } from 'react-native';
import { act, render, screen, fireEvent } from '@testing-library/react-native';
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
    expect(screen.getByLabelText('Step 2 of 3: Payment, current').props.accessibilityState.selected).toBe(true);
    expect(screen.getByLabelText('Step 1 of 3: Account, completed').props.accessibilityState.selected).toBe(false);
  });

  it('completedIndicator="number" keeps showing numbers on completed steps', () => {
    render(withProvider(<Steps steps={STEPS} current={2} completedIndicator="number" />));
    expect(screen.getByText('1')).toBeOnTheScreen();
    expect(screen.getByText('2')).toBeOnTheScreen();
  });

  it('completedIndicator="check" replaces the number on completed steps', () => {
    render(withProvider(<Steps steps={STEPS} current={2} completedIndicator="check" />));
    // the current step (3) still shows its number; the completed ones don't
    expect(screen.getByText('3')).toBeOnTheScreen();
    expect(screen.queryByText('1')).not.toBeOnTheScreen();
  });

  it('renders in vertical orientation', () => {
    render(withProvider(<Steps steps={STEPS} current={0} orientation="vertical" />));
    expect(screen.getByText('Account')).toBeOnTheScreen();
    expect(screen.getByText('Confirm')).toBeOnTheScreen();
  });

  it('gives each horizontal step a minimum width so long labels do not break mid-word', () => {
    render(
      withProvider(
        <Steps
          steps={[
            { label: 'Pago Confirmado', description: 'Verificado' },
            { label: 'Almacén', description: 'Empacado' },
            { label: 'En Ruta', description: 'Repartido o en camino' },
            { label: 'Entregado', description: 'Entregado en destino' },
          ]}
          current={3}
        />
      )
    );

    const step = screen.getByLabelText('Step 2 of 4: Almacén, completed');
    expect(StyleSheet.flatten(step.props.style).minWidth).toBeGreaterThanOrEqual(72);
  });

  it('the horizontal row hugs its content instead of stretching to the container height', () => {
    render(withProvider(<Steps steps={STEPS} current={0} testID="steps" />));
    expect(StyleSheet.flatten(screen.getByTestId('steps').props.style).flexGrow).toBe(0);
  });

  it('is not pressable without onStepPress', () => {
    render(withProvider(<Steps steps={STEPS} current={0} />));
    expect(screen.getByLabelText('Step 1 of 3: Account, current').props.accessibilityRole).toBe('text');
  });

  it('reports the pressed index when onStepPress is given', () => {
    const onStepPress = jest.fn();
    render(withProvider(<Steps steps={STEPS} current={2} onStepPress={onStepPress} />));
    fireEvent.press(screen.getByLabelText('Step 1 of 3: Account, completed'));
    expect(onStepPress).toHaveBeenCalledWith(0);
  });

  it('announces position and state with words from labels', () => {
    render(
      <UIProvider
        mode="light"
        labels={{ stepOf: 'Paso {n} de {total}: {label}', stepCompleted: 'hecho', stepCurrent: 'actual', stepPending: 'pendiente' }}
      >
        <Steps steps={STEPS} current={1} />
      </UIProvider>
    );
    expect(screen.getByLabelText('Paso 1 de 3: Account, hecho')).toBeTruthy();
    expect(screen.getByLabelText('Paso 2 de 3: Payment, actual')).toBeTruthy();
    expect(screen.getByLabelText('Paso 3 de 3: Confirm, pendiente')).toBeTruthy();
  });

  it('only the current step label takes the accent (Von Restorff)', () => {
    render(withProvider(<Steps steps={STEPS} current={1} />));
    const flat = (t: string) => StyleSheet.flatten(screen.getByText(t).props.style);
    expect(flat('Payment').color).not.toBe(flat('Account').color);
    expect(flat('Confirm').color).not.toBe(flat('Payment').color);
  });

  it('vertical: the last step adds no trailing space', () => {
    render(withProvider(<Steps steps={STEPS} current={0} orientation="vertical" />));
    const container = screen.getByText('Confirm').parent?.parent;
    expect(StyleSheet.flatten(container?.props.style).paddingBottom).toBe(0);
  });

  it('when the row overflows, brings the current step into view and flashes the scroll bar', () => {
    const { ScrollView } = require('react-native');
    const scrollTo = jest.spyOn(ScrollView.prototype, 'scrollTo').mockImplementation(() => {});
    const flash = jest.spyOn(ScrollView.prototype, 'flashScrollIndicators').mockImplementation(() => {});
    render(withProvider(<Steps steps={STEPS} current={2} testID="steps" />));
    const row = screen.getByTestId('steps');
    act(() => {
      fireEvent(screen.getByLabelText('Step 3 of 3: Confirm, current'), 'layout', {
        nativeEvent: { layout: { x: 400, y: 0, width: 76, height: 60 } },
      });
      fireEvent(row, 'layout', { nativeEvent: { layout: { x: 0, y: 0, width: 300, height: 60 } } });
      fireEvent(row, 'contentSizeChange', 500, 60);
    });
    expect(scrollTo).toHaveBeenCalledWith(expect.objectContaining({ x: 400 - 300 / 4 }));
    expect(flash).toHaveBeenCalled();
    scrollTo.mockRestore();
    flash.mockRestore();
  });
});
