import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { UIProvider } from '../../theme/UIProvider';
import { FormActions } from '../FormActions';

function withProvider(children: React.ReactNode) {
  return <UIProvider mode="light">{children}</UIProvider>;
}

describe('FormActions', () => {
  it('renders both buttons when primaryLabel/onPrimaryPress are given', () => {
    render(
      withProvider(
        <FormActions primaryLabel="Save" onPrimaryPress={() => {}} onSecondaryPress={() => {}} />
      )
    );
    expect(screen.getByRole('button', { name: 'Save' })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Close' })).toBeOnTheScreen();
  });

  it('hides the primary button when primaryLabel is omitted', () => {
    render(withProvider(<FormActions onSecondaryPress={() => {}} />));
    expect(screen.queryByRole('button', { name: 'Save' })).not.toBeOnTheScreen();
  });

  it('calls onSecondaryPress', () => {
    const onSecondaryPress = jest.fn();
    render(withProvider(<FormActions onSecondaryPress={onSecondaryPress} secondaryLabel="Cerrar" />));
    fireEvent.press(screen.getByRole('button', { name: 'Cerrar' }));
    expect(onSecondaryPress).toHaveBeenCalledTimes(1);
  });
});
