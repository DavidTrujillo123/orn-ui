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
});
