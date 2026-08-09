import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { UIProvider } from '../../theme/UIProvider';
import { SegmentedControl } from '../SegmentedControl';

const OPTIONS = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
];

function withProvider(children: React.ReactNode) {
  return <UIProvider mode="light">{children}</UIProvider>;
}

describe('SegmentedControl', () => {
  it('renders one radio per option inside a radiogroup', () => {
    render(withProvider(<SegmentedControl options={OPTIONS} value="day" onChange={() => {}} testID="sc" />));
    expect(screen.getAllByRole('radio')).toHaveLength(3);
    expect(screen.getByTestId('sc').props.accessibilityRole).toBe('radiogroup');
  });

  it('marks the current value as selected', () => {
    render(withProvider(<SegmentedControl options={OPTIONS} value="week" onChange={() => {}} />));
    expect(screen.getByRole('radio', { name: 'Week' })).toBeSelected();
    expect(screen.getByRole('radio', { name: 'Day' })).not.toBeSelected();
  });

  it('reports the pressed value', () => {
    const onChange = jest.fn();
    render(withProvider(<SegmentedControl options={OPTIONS} value="day" onChange={onChange} />));
    fireEvent.press(screen.getByRole('radio', { name: 'Month' }));
    expect(onChange).toHaveBeenCalledWith('month');
  });

  it('does not report anything when the whole control is disabled', () => {
    const onChange = jest.fn();
    render(withProvider(<SegmentedControl options={OPTIONS} value="day" onChange={onChange} disabled />));
    fireEvent.press(screen.getByRole('radio', { name: 'Month' }));
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole('radio', { name: 'Month' })).toBeDisabled();
  });

  it('disables a single option without touching the others', () => {
    const onChange = jest.fn();
    render(
      withProvider(
        <SegmentedControl
          options={[...OPTIONS.slice(0, 2), { value: 'month', label: 'Month', disabled: true }]}
          value="day"
          onChange={onChange}
        />
      )
    );
    fireEvent.press(screen.getByRole('radio', { name: 'Month' }));
    expect(onChange).not.toHaveBeenCalled();

    fireEvent.press(screen.getByRole('radio', { name: 'Week' }));
    expect(onChange).toHaveBeenCalledWith('week');
  });
});
