import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { UIProvider } from '../../theme/UIProvider';
import type { Labels } from '../../theme/labels';
import { TimePicker } from '../TimePicker';

const ITEM_HEIGHT = 44;

function withProvider(children: React.ReactNode, labels?: Partial<Labels>) {
  return (
    <UIProvider mode="light" labels={labels}>
      {children}
    </UIProvider>
  );
}

/** Leaves a wheel quiet on row `index`, as at the end of a fling. */
function settleIndex(wheelTestID: string, index: number) {
  fireEvent(screen.getByTestId(`${wheelTestID}-scroll`), 'momentumScrollEnd', {
    nativeEvent: { contentOffset: { y: index * ITEM_HEIGHT } },
  });
}

describe('TimePicker', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => {
    act(() => jest.runOnlyPendingTimers());
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('starts without a selected row and does not call onChange on mount', () => {
    const onChange = jest.fn();
    render(withProvider(<TimePicker onChange={onChange} testID="time" />));
    act(() => jest.runOnlyPendingTimers());

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByText('Not selected')).toBeOnTheScreen();
    expect(screen.getByLabelText('Hour').props.accessibilityValue.text).toBeUndefined();
    expect(screen.getByLabelText('Minute').props.accessibilityValue.text).toBeUndefined();
    expect(screen.queryByTestId('time-hour-window')).not.toBeOnTheScreen();
    expect(screen.queryByTestId('time-minute-window')).not.toBeOnTheScreen();
  });

  it('emits the first valid minute of the chosen hour when starting empty', () => {
    const onChange = jest.fn();
    render(
      withProvider(
        <TimePicker
          onChange={onChange}
          minTime={{ hour: 9, minute: 30 }}
          maxTime={{ hour: 17, minute: 15 }}
          minuteStep={5}
          testID="time"
        />
      )
    );

    settleIndex('time-hour', 12);
    expect(onChange).toHaveBeenCalledWith({ hour: 12, minute: 0 });
  });

  it('emits the first valid hour when starting empty and picking a minute', () => {
    const onChange = jest.fn();
    render(
      withProvider(
        <TimePicker
          onChange={onChange}
          minTime={{ hour: 9, minute: 30 }}
          maxTime={{ hour: 17, minute: 15 }}
          minuteStep={5}
          testID="time"
        />
      )
    );

    settleIndex('time-minute', 9); // 0, 5, 10... -> row 9 is minute 45
    expect(onChange).toHaveBeenCalledWith({ hour: 9, minute: 45 });
  });

  it('disables AM/PM until the first interaction when starting empty in 12-hour format', () => {
    const onChange = jest.fn();
    render(withProvider(<TimePicker onChange={onChange} hourFormat="12h" testID="time" />));

    expect(screen.getByRole('radio', { name: 'AM' })).toBeDisabled();
    expect(screen.getByRole('radio', { name: 'PM' })).toBeDisabled();
    expect(screen.getByRole('radio', { name: 'AM' })).not.toBeSelected();
    expect(screen.getByRole('radio', { name: 'PM' })).not.toBeSelected();

    settleIndex('time-hour', 1); // 12, 1... -> row 1 is 1 AM
    expect(onChange).toHaveBeenCalledWith({ hour: 1, minute: 0 });
  });

  it('reports the hour left in the centre and keeps the minute', () => {
    const onChange = jest.fn();
    render(withProvider(<TimePicker value={{ hour: 9, minute: 30 }} onChange={onChange} testID="time" />));

    settleIndex('time-hour', 10);
    expect(onChange).toHaveBeenCalledWith({ hour: 10, minute: 30 });
  });

  it('reports the minute left in the centre', () => {
    const onChange = jest.fn();
    render(withProvider(<TimePicker value={{ hour: 9, minute: 30 }} onChange={onChange} testID="time" />));

    settleIndex('time-minute', 45);
    expect(onChange).toHaveBeenCalledWith({ hour: 9, minute: 45 });
  });

  it('maps 0, 12 and 13 to 12 AM, 12 PM and 1 PM in 12-hour format', () => {
    const { rerender } = render(
      withProvider(<TimePicker value={{ hour: 0, minute: 0 }} hourFormat="12h" testID="time" />)
    );

    expect(screen.getByLabelText('Hour').props.accessibilityValue.text).toBe('12');
    expect(screen.getByLabelText('Minute').props.accessibilityValue.text).toBe('00');
    expect(screen.getByRole('radio', { name: 'AM' })).toBeSelected();
    expect(screen.getByRole('radio', { name: 'PM' })).not.toBeSelected();

    rerender(withProvider(<TimePicker value={{ hour: 12, minute: 0 }} hourFormat="12h" testID="time" />));
    expect(screen.getByLabelText('Hour').props.accessibilityValue.text).toBe('12');
    expect(screen.getByRole('radio', { name: 'PM' })).toBeSelected();

    rerender(withProvider(<TimePicker value={{ hour: 13, minute: 5 }} hourFormat="12h" testID="time" />));
    expect(screen.getByLabelText('Hour').props.accessibilityValue.text).toBe('1');
    expect(screen.getByLabelText('Minute').props.accessibilityValue.text).toBe('05');
    expect(screen.getByRole('radio', { name: 'PM' })).toBeSelected();
  });

  it('does not render the AM/PM control in 24-hour format', () => {
    render(withProvider(<TimePicker value={{ hour: 13, minute: 5 }} testID="time" />));

    expect(screen.getByLabelText('Hour').props.accessibilityValue.text).toBe('13');
    expect(screen.queryByRole('radiogroup')).not.toBeOnTheScreen();
  });

  it('changes the period while keeping the displayed hour', () => {
    const onChange = jest.fn();
    render(
      withProvider(
        <TimePicker value={{ hour: 13, minute: 5 }} onChange={onChange} hourFormat="12h" testID="time" />
      )
    );

    fireEvent.press(screen.getByRole('radio', { name: 'AM' }));
    expect(onChange).toHaveBeenCalledWith({ hour: 1, minute: 5 });
  });

  it('clamps the minute when the new period has a narrower valid range', () => {
    const onChange = jest.fn();
    render(
      withProvider(
        <TimePicker
          value={{ hour: 9, minute: 50 }}
          onChange={onChange}
          hourFormat="12h"
          minuteStep={5}
          minTime={{ hour: 9, minute: 30 }}
          maxTime={{ hour: 21, minute: 45 }}
          testID="time"
        />
      )
    );

    fireEvent.press(screen.getByRole('radio', { name: 'PM' }));
    expect(onChange).toHaveBeenCalledWith({ hour: 21, minute: 45 });
  });

  it('disables a period that has no valid time for the selected hour', () => {
    const onChange = jest.fn();
    render(
      withProvider(
        <TimePicker
          value={{ hour: 23, minute: 0 }}
          onChange={onChange}
          hourFormat="12h"
          minTime={{ hour: 13, minute: 30 }}
          maxTime={{ hour: 23, minute: 0 }}
          testID="time"
        />
      )
    );

    const am = screen.getByRole('radio', { name: 'AM' });
    expect(am).toBeDisabled();
    fireEvent.press(am);
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole('radio', { name: 'PM' })).toBeSelected();
  });

  it('switches to the valid period when the selected hour has no time in the current one', () => {
    const onChange = jest.fn();
    render(
      withProvider(
        <TimePicker
          value={{ hour: 21, minute: 45 }}
          onChange={onChange}
          hourFormat="12h"
          minuteStep={5}
          minTime={{ hour: 9, minute: 30 }}
          maxTime={{ hour: 21, minute: 45 }}
          testID="time"
        />
      )
    );

    settleIndex('time-hour', 10); // 12, 1... -> row 10 is 10
    expect(onChange).toHaveBeenCalledWith({ hour: 10, minute: 45 });
  });

  it('skips an hour that has no valid time and clamps the minute to the boundary', () => {
    const onChange = jest.fn();
    render(
      withProvider(
        <TimePicker
          value={{ hour: 23, minute: 0 }}
          onChange={onChange}
          hourFormat="12h"
          minuteStep={5}
          minTime={{ hour: 13, minute: 30 }}
          maxTime={{ hour: 23, minute: 0 }}
          testID="time"
        />
      )
    );

    settleIndex('time-hour', 0); // 12 AM/PM are out of bounds
    expect(onChange).toHaveBeenCalledWith({ hour: 13, minute: 30 });
  });

  it('only offers minutes on the minuteStep grid and computes the first valid minute on it', () => {
    const onChange = jest.fn();
    const { rerender } = render(
      withProvider(<TimePicker value={{ hour: 10, minute: 0 }} onChange={onChange} minuteStep={7} testID="time" />)
    );

    expect(screen.getByText('56')).toBeOnTheScreen();
    expect(screen.queryByText('57')).not.toBeOnTheScreen();
    expect(screen.queryByText('59')).not.toBeOnTheScreen();

    settleIndex('time-minute', 8); // 0, 7... -> row 8 is minute 56
    expect(onChange).toHaveBeenCalledWith({ hour: 10, minute: 56 });

    onChange.mockClear();
    rerender(
      withProvider(
        <TimePicker
          onChange={onChange}
          minuteStep={7}
          minTime={{ hour: 10, minute: 3 }}
          maxTime={{ hour: 10, minute: 50 }}
          testID="time"
        />
      )
    );

    settleIndex('time-hour', 10);
    expect(onChange).toHaveBeenCalledWith({ hour: 10, minute: 7 });
  });

  it('shows an off-grid minute without a selected row and normalizes on the first interaction', () => {
    const onChange = jest.fn();
    render(
      withProvider(
        <TimePicker
          value={{ hour: 10, minute: 17 }}
          onChange={onChange}
          hourFormat="12h"
          minuteStep={5}
          testID="time"
        />
      )
    );

    expect(screen.getByLabelText('Minute').props.accessibilityValue.text).toBeUndefined();
    expect(screen.queryByText('17')).not.toBeOnTheScreen();

    settleIndex('time-minute', 3); // 0, 5, 10, 15 -> row 3 is minute 15
    expect(onChange).toHaveBeenCalledWith({ hour: 10, minute: 15 });
  });

  it('does not mark an out-of-range minute as selected and normalizes it on interaction', () => {
    const onChange = jest.fn();
    render(
      withProvider(
        <TimePicker
          value={{ hour: 10, minute: 75 }}
          onChange={onChange}
          hourFormat="12h"
          minuteStep={5}
          testID="time"
        />
      )
    );

    expect(screen.getByLabelText('Hour').props.accessibilityValue.text).toBe('10');
    expect(screen.getByLabelText('Minute').props.accessibilityValue.text).toBeUndefined();
    expect(screen.getByTestId('time-hour-window')).toBeOnTheScreen();
    expect(screen.queryByTestId('time-minute-window')).not.toBeOnTheScreen();
    expect(screen.getByRole('radio', { name: 'AM' })).not.toBeSelected();
    expect(screen.getByRole('radio', { name: 'PM' })).not.toBeSelected();

    settleIndex('time-minute', 3); // 0, 5, 10, 15 -> row 3 is minute 15
    expect(onChange).toHaveBeenCalledWith({ hour: 10, minute: 15 });
  });

  it('does not emit for an out-of-range value on mount or when the value changes from outside', () => {
    const onChange = jest.fn();
    const { rerender } = render(
      withProvider(
        <TimePicker value={{ hour: 8, minute: 0 }} onChange={onChange} minTime={{ hour: 9, minute: 0 }} testID="time" />
      )
    );

    act(() => jest.runOnlyPendingTimers());
    expect(onChange).not.toHaveBeenCalled();

    rerender(
      withProvider(
        <TimePicker value={{ hour: 7, minute: 0 }} onChange={onChange} minTime={{ hour: 9, minute: 0 }} testID="time" />
      )
    );
    act(() => jest.runOnlyPendingTimers());
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Hour').props.accessibilityValue.text).toBe('07');
  });

  it('disables the minute wheel when the value has no valid minute for its hour', () => {
    const onChange = jest.fn();
    const { rerender } = render(
      withProvider(
        <TimePicker value={{ hour: 8, minute: 0 }} onChange={onChange} minTime={{ hour: 9, minute: 0 }} testID="time" />
      )
    );

    expect(screen.getByTestId('time-hour-scroll')).toHaveProp('scrollEnabled', true);
    expect(screen.getByTestId('time-minute-scroll')).toHaveProp('scrollEnabled', false);

    rerender(
      withProvider(<TimePicker value={{ hour: 30, minute: 10 }} onChange={onChange} hourFormat="12h" testID="time" />)
    );

    expect(screen.getByLabelText('Hour').props.accessibilityValue.text).toBeUndefined();
    expect(screen.getByTestId('time-minute-scroll')).toHaveProp('scrollEnabled', false);
    expect(screen.getByRole('radio', { name: 'AM' })).toBeDisabled();
    expect(screen.getByRole('radio', { name: 'PM' })).toBeDisabled();
    expect(onChange).not.toHaveBeenCalled();

    settleIndex('time-hour', 6);
    expect(onChange).toHaveBeenCalledWith({ hour: 6, minute: 10 });

    onChange.mockClear();
    settleIndex('time-minute', 20);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('exposes adjustable wheels with increment/decrement actions', () => {
    const onChange = jest.fn();
    render(withProvider(<TimePicker value={{ hour: 9, minute: 30 }} onChange={onChange} testID="time" />));

    const hourWheel = screen.getByLabelText('Hour');
    expect(hourWheel).toHaveProp('accessibilityRole', 'adjustable');
    expect(hourWheel).toHaveProp('accessibilityValue', { text: '09' });
    expect(hourWheel).toHaveProp('accessibilityState', { disabled: false });

    fireEvent(hourWheel, 'accessibilityAction', { nativeEvent: { actionName: 'increment' } });
    expect(onChange).toHaveBeenCalledWith({ hour: 10, minute: 30 });

    const minuteWheel = screen.getByLabelText('Minute');
    expect(minuteWheel).toHaveProp('accessibilityRole', 'adjustable');
    expect(minuteWheel).toHaveProp('accessibilityValue', { text: '30' });

    fireEvent(minuteWheel, 'accessibilityAction', { nativeEvent: { actionName: 'decrement' } });
    expect(onChange).toHaveBeenCalledWith({ hour: 9, minute: 29 });
  });

  it('disables the wheels and the period control', () => {
    const onChange = jest.fn();
    render(
      withProvider(
        <TimePicker value={{ hour: 9, minute: 30 }} onChange={onChange} hourFormat="12h" disabled testID="time" />
      )
    );

    expect(screen.getByTestId('time-hour-scroll')).toHaveProp('scrollEnabled', false);
    expect(screen.getByTestId('time-minute-scroll')).toHaveProp('scrollEnabled', false);
    expect(screen.getByRole('radio', { name: 'AM' })).toBeDisabled();

    fireEvent(screen.getByLabelText('Hour'), 'accessibilityAction', {
      nativeEvent: { actionName: 'increment' },
    });
    expect(onChange).not.toHaveBeenCalled();
  });

  it('takes the visible and accessible texts from UIProvider labels', () => {
    render(
      <UIProvider
        mode="light"
        labels={{ timeHour: 'Hora', timeMinute: 'Minuto', am: 'a. m.', pm: 'p. m.', timeUnselected: 'Sin seleccionar' }}
      >
        <TimePicker hourFormat="12h" testID="time" />
      </UIProvider>
    );

    expect(screen.getByLabelText('Hora')).toBeOnTheScreen();
    expect(screen.getByLabelText('Minuto')).toBeOnTheScreen();
    expect(screen.getByRole('radio', { name: 'a. m.' })).toBeOnTheScreen();
    expect(screen.getByRole('radio', { name: 'p. m.' })).toBeOnTheScreen();
    expect(screen.getByText('Sin seleccionar')).toBeOnTheScreen();
  });

  it('marks the visible label as a header', () => {
    render(withProvider(<TimePicker label="Departure" testID="time" />));

    expect(screen.getByText('Departure')).toHaveProp('accessibilityRole', 'header');
  });

  it('warns and ignores bounds when minTime is after maxTime', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const onChange = jest.fn();
    render(
      withProvider(
        <TimePicker
          value={{ hour: 8, minute: 0 }}
          onChange={onChange}
          minTime={{ hour: 18, minute: 0 }}
          maxTime={{ hour: 9, minute: 0 }}
          testID="time"
        />
      )
    );

    expect(warn).toHaveBeenCalledWith(expect.stringContaining('minTime after maxTime'));

    fireEvent(screen.getByLabelText('Hour'), 'accessibilityAction', {
      nativeEvent: { actionName: 'increment' },
    });
    expect(onChange).toHaveBeenCalledWith({ hour: 9, minute: 0 });
  });

  it('warns and disables the picker when no time fits the bounds and step', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    render(
      withProvider(
        <TimePicker
          minTime={{ hour: 10, minute: 1 }}
          maxTime={{ hour: 10, minute: 2 }}
          minuteStep={5}
          testID="time"
        />
      )
    );

    expect(warn).toHaveBeenCalledWith(expect.stringContaining('no representable time'));
    expect(screen.getByTestId('time-hour-scroll')).toHaveProp('scrollEnabled', false);
    expect(screen.getByTestId('time-minute-scroll')).toHaveProp('scrollEnabled', false);
  });

  it('follows value changes from outside without emitting', () => {
    const onChange = jest.fn();
    const { rerender } = render(
      withProvider(<TimePicker value={{ hour: 9, minute: 30 }} onChange={onChange} testID="time" />)
    );

    rerender(withProvider(<TimePicker value={{ hour: 14, minute: 45 }} onChange={onChange} testID="time" />));

    expect(screen.getByLabelText('Hour').props.accessibilityValue.text).toBe('14');
    expect(screen.getByLabelText('Minute').props.accessibilityValue.text).toBe('45');
    expect(onChange).not.toHaveBeenCalled();
  });
});
