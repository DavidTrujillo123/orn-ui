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

  it('does not report a press on the segment already selected', () => {
    const onChange = jest.fn();
    render(withProvider(<SegmentedControl options={OPTIONS} value="week" onChange={onChange} />));
    fireEvent.press(screen.getByRole('radio', { name: 'Week' }));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('every segment reaches a 44pt touch target with the track inset', () => {
    render(withProvider(<SegmentedControl options={OPTIONS} value="week" onChange={() => {}} testID="seg" />));
    const segment = screen.getByTestId('seg-day');
    const flat = Object.assign({}, ...[segment.props.style].flat(Infinity).filter(Boolean));
    const slop = segment.props.hitSlop ?? {};
    expect(flat.minHeight + (slop.top ?? 0) + (slop.bottom ?? 0)).toBeGreaterThanOrEqual(44);
  });

  it('keeps long labels on one line so segments stay equal', () => {
    render(
      withProvider(
        <SegmentedControl options={[{ value: 'a', label: 'Highest rated first' }]} value="a" onChange={() => {}} />
      )
    );
    expect(screen.getByText('Highest rated first').props.numberOfLines).toBe(1);
  });

  it('in dark the selected segment uses the soft accent, not a surface darker than the track', () => {
    render(
      <UIProvider mode="dark">
        <SegmentedControl options={OPTIONS} value="week" onChange={() => {}} testID="seg" />
      </UIProvider>
    );
    expect(screen.getByTestId('seg-week')).toHaveStyle({ backgroundColor: '#1b2740' });
  });
});
