import React from 'react';
import { act, render, screen, fireEvent } from '@testing-library/react-native';
import { UIProvider } from '../../theme/UIProvider';
import { DatePicker, buildMonthGrid } from '../DatePicker';
import { DateField } from '../DateField';

function withProvider(children: React.ReactNode) {
  return <UIProvider mode="light">{children}</UIProvider>;
}

// Marzo 2024: el 1 cae viernes, 31 días.
const MARCH_2024 = new Date(2024, 2, 15);

describe('buildMonthGrid', () => {
  it('always returns 6 rows of 7 cells so the layout does not jump between months', () => {
    const grid = buildMonthGrid(2024, 2, 0);
    expect(grid).toHaveLength(6);
    grid.forEach((row) => expect(row).toHaveLength(7));
  });

  it('pads leading cells according to the first weekday', () => {
    // 1 de marzo 2024 es viernes (getDay() === 5) ⇒ 5 celdas vacías antes
    const grid = buildMonthGrid(2024, 2, 0);
    expect(grid[0]!.slice(0, 5).every((c) => c === null)).toBe(true);
    expect(grid[0]![5]?.getDate()).toBe(1);
  });

  it('shifts the padding when the week starts on Monday', () => {
    const grid = buildMonthGrid(2024, 2, 1);
    expect(grid[0]![4]?.getDate()).toBe(1);
  });

  it('includes every day of the month', () => {
    const days = buildMonthGrid(2024, 1, 0) // febrero 2024, bisiesto
      .flat()
      .filter(Boolean);
    expect(days).toHaveLength(29);
  });
});

describe('DatePicker', () => {
  it('shows the visible month and year', () => {
    render(withProvider(<DatePicker value={MARCH_2024} onChange={() => {}} />));
    expect(screen.getByText('March 2024')).toBeOnTheScreen();
  });

  it('reports the tapped day', () => {
    const onChange = jest.fn();
    render(withProvider(<DatePicker value={MARCH_2024} onChange={onChange} />));
    fireEvent.press(screen.getByLabelText('March 20, 2024'));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][0].getDate()).toBe(20);
  });

  it('marks the selected day', () => {
    render(withProvider(<DatePicker value={MARCH_2024} onChange={() => {}} />));
    expect(screen.getByLabelText('March 15, 2024').props.accessibilityState.selected).toBe(true);
  });

  it('navigates to the previous and next month', () => {
    render(withProvider(<DatePicker value={MARCH_2024} onChange={() => {}} />));
    fireEvent.press(screen.getByRole('button', { name: 'Previous month' }));
    expect(screen.getByText('February 2024')).toBeOnTheScreen();
    fireEvent.press(screen.getByRole('button', { name: 'Next month' }));
    fireEvent.press(screen.getByRole('button', { name: 'Next month' }));
    expect(screen.getByText('April 2024')).toBeOnTheScreen();
  });

  it('disables days before minDate', () => {
    render(
      withProvider(<DatePicker value={MARCH_2024} onChange={() => {}} minDate={new Date(2024, 2, 10)} />)
    );
    expect(screen.getByLabelText('March 5, 2024').props.accessibilityState.disabled).toBe(true);
    expect(screen.getByLabelText('March 20, 2024').props.accessibilityState.disabled).toBe(false);
  });

  it('disables days after maxDate', () => {
    render(
      withProvider(<DatePicker value={MARCH_2024} onChange={() => {}} maxDate={new Date(2024, 2, 20)} />)
    );
    expect(screen.getByLabelText('March 25, 2024').props.accessibilityState.disabled).toBe(true);
  });

  it('does not fire onChange for an out-of-range day', () => {
    const onChange = jest.fn();
    render(withProvider(<DatePicker value={MARCH_2024} onChange={onChange} minDate={new Date(2024, 2, 10)} />));
    fireEvent.press(screen.getByLabelText('March 5, 2024'));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('accepts localized month names', () => {
    render(
      withProvider(
        <DatePicker
          value={MARCH_2024}
          onChange={() => {}}
          monthNames={['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']}
        />
      )
    );
    expect(screen.getByText('Mar 2024')).toBeOnTheScreen();
  });

  it('follows the value when it changes from the outside', () => {
    const { rerender } = render(withProvider(<DatePicker value={MARCH_2024} onChange={() => {}} />));
    expect(screen.getByText('March 2024')).toBeOnTheScreen();
    rerender(withProvider(<DatePicker value={new Date(2025, 6, 4)} onChange={() => {}} />));
    expect(screen.getByText('July 2025')).toBeOnTheScreen();
  });

  it('keeps the month the user navigated to when the value stays in it', () => {
    const { rerender } = render(withProvider(<DatePicker value={MARCH_2024} onChange={() => {}} />));
    fireEvent.press(screen.getByRole('button', { name: 'Next month' }));
    rerender(withProvider(<DatePicker value={new Date(2024, 2, 20)} onChange={() => {}} />));
    expect(screen.getByText('April 2024')).toBeOnTheScreen();
  });

  it('disables the arrow that would leave the allowed months behind', () => {
    render(
      withProvider(
        <DatePicker
          value={MARCH_2024}
          onChange={() => {}}
          minDate={new Date(2024, 2, 1)}
          maxDate={new Date(2024, 3, 30)}
        />
      )
    );
    expect(screen.getByRole('button', { name: 'Previous month' }).props.accessibilityState.disabled).toBe(true);
    expect(screen.getByRole('button', { name: 'Next month' }).props.accessibilityState.disabled).toBe(false);
  });

  it('reports the month left on screen', () => {
    const onVisibleMonthChange = jest.fn();
    render(
      withProvider(
        <DatePicker value={MARCH_2024} onChange={() => {}} onVisibleMonthChange={onVisibleMonthChange} />
      )
    );
    fireEvent.press(screen.getByRole('button', { name: 'Next month' }));
    expect(onVisibleMonthChange.mock.calls[0][0].getMonth()).toBe(3);
  });

  it('takes the month names from the provider labels', () => {
    render(
      <UIProvider mode="light" labels={{ months: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'] }}>
        <DatePicker value={MARCH_2024} onChange={() => {}} />
      </UIProvider>
    );
    expect(screen.getByText('Mar 2024')).toBeOnTheScreen();
  });

  it('falls back to defaultMonth when there is no value', () => {
    render(withProvider(<DatePicker onChange={() => {}} defaultMonth={new Date(2023, 0, 1)} />));
    expect(screen.getByText('January 2023')).toBeOnTheScreen();
  });
});

describe('DatePicker — range mode', () => {
  it('the first tap sets the start and leaves the range open', () => {
    const onRangeChange = jest.fn();
    render(
      withProvider(<DatePicker mode="range" defaultMonth={MARCH_2024} onRangeChange={onRangeChange} />)
    );
    fireEvent.press(screen.getByLabelText('March 10, 2024'));
    expect(onRangeChange).toHaveBeenCalledTimes(1);
    const arg = onRangeChange.mock.calls[0][0];
    expect(arg.start.getDate()).toBe(10);
    expect(arg.end).toBeUndefined();
  });

  it('the second tap closes the range', () => {
    const onRangeChange = jest.fn();
    render(
      withProvider(
        <DatePicker
          mode="range"
          defaultMonth={MARCH_2024}
          range={{ start: new Date(2024, 2, 10) }}
          onRangeChange={onRangeChange}
        />
      )
    );
    fireEvent.press(screen.getByLabelText('March 15, 2024'));
    const arg = onRangeChange.mock.calls[0][0];
    expect(arg.start.getDate()).toBe(10);
    expect(arg.end.getDate()).toBe(15);
  });

  it('tapping before the start restarts the range instead of inverting it', () => {
    const onRangeChange = jest.fn();
    render(
      withProvider(
        <DatePicker
          mode="range"
          defaultMonth={MARCH_2024}
          range={{ start: new Date(2024, 2, 20) }}
          onRangeChange={onRangeChange}
        />
      )
    );
    fireEvent.press(screen.getByLabelText('March 5, 2024'));
    const arg = onRangeChange.mock.calls[0][0];
    expect(arg.start.getDate()).toBe(5);
    expect(arg.end).toBeUndefined();
  });

  it('tapping on a closed range starts a new one', () => {
    const onRangeChange = jest.fn();
    render(
      withProvider(
        <DatePicker
          mode="range"
          defaultMonth={MARCH_2024}
          range={{ start: new Date(2024, 2, 10), end: new Date(2024, 2, 15) }}
          onRangeChange={onRangeChange}
        />
      )
    );
    fireEvent.press(screen.getByLabelText('March 22, 2024'));
    const arg = onRangeChange.mock.calls[0][0];
    expect(arg.start.getDate()).toBe(22);
    expect(arg.end).toBeUndefined();
  });

  it('marks both ends of the range as selected', () => {
    render(
      withProvider(
        <DatePicker
          mode="range"
          defaultMonth={MARCH_2024}
          range={{ start: new Date(2024, 2, 10), end: new Date(2024, 2, 15) }}
          onRangeChange={() => {}}
        />
      )
    );
    expect(screen.getByLabelText('March 10, 2024').props.accessibilityState.selected).toBe(true);
    expect(screen.getByLabelText('March 15, 2024').props.accessibilityState.selected).toBe(true);
    // un día intermedio se resalta pero no cuenta como "selected"
    expect(screen.getByLabelText('March 12, 2024').props.accessibilityState.selected).toBe(false);
  });

  it('does not call onChange in range mode', () => {
    const onChange = jest.fn();
    render(
      withProvider(
        <DatePicker mode="range" defaultMonth={MARCH_2024} onChange={onChange} onRangeChange={() => {}} />
      )
    );
    fireEvent.press(screen.getByLabelText('March 10, 2024'));
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe('DateField', () => {
  // DateField monta un Modal, que anima su entrada/salida con Animated. Sin
  // fake timers esos timers sobreviven al test y disparan contra un entorno
  // de Jest ya desmontado ("environment has been torn down").
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => {
    act(() => jest.runOnlyPendingTimers());
    jest.useRealTimers();
  });

  it('shows the placeholder when empty', () => {
    render(withProvider(<DateField label="Due date" onChange={() => {}} placeholder="Pick one" />));
    expect(screen.getByText('Pick one')).toBeOnTheScreen();
  });

  it('formats the selected date by default', () => {
    render(withProvider(<DateField label="Due date" value={MARCH_2024} onChange={() => {}} />));
    expect(screen.getByText('March 15, 2024')).toBeOnTheScreen();
  });

  it('accepts a custom format', () => {
    render(
      withProvider(
        <DateField
          label="Due date"
          value={MARCH_2024}
          onChange={() => {}}
          format={(d) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`}
        />
      )
    );
    expect(screen.getByText('2024-3-15')).toBeOnTheScreen();
  });

  it('opens the calendar and reports the chosen date', () => {
    const onChange = jest.fn();
    render(withProvider(<DateField label="Due date" value={MARCH_2024} onChange={onChange} />));
    fireEvent.press(screen.getByRole('button', { name: 'Due date, March 15, 2024' }));
    fireEvent.press(screen.getByLabelText('March 20, 2024'));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][0].getDate()).toBe(20);
  });

  it('does not render a clear button without onClear', () => {
    render(withProvider(<DateField label="Due date" value={MARCH_2024} onChange={() => {}} />));
    fireEvent.press(screen.getByRole('button', { name: 'Due date, March 15, 2024' }));
    expect(screen.queryByText('Clear')).not.toBeOnTheScreen();
  });

  it('clears the value and closes when the clear button is pressed', () => {
    const onClear = jest.fn();
    render(withProvider(<DateField label="Due date" value={MARCH_2024} onChange={() => {}} onClear={onClear} />));
    fireEvent.press(screen.getByRole('button', { name: 'Due date, March 15, 2024' }));
    fireEvent.press(screen.getByText('Clear'));
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it('mode="range" shows both ends and only closes once the range is closed', () => {
    const onRangeChange = jest.fn();
    const { rerender } = render(
      withProvider(
        <DateField
          label="Stay"
          mode="range"
          range={{ start: new Date(2024, 2, 10) }}
          onRangeChange={onRangeChange}
        />
      )
    );
    expect(screen.getByText('March 10, 2024')).toBeOnTheScreen();

    fireEvent.press(screen.getByRole('button', { name: 'Stay, March 10, 2024' }));
    fireEvent.press(screen.getByLabelText('March 14, 2024'));
    expect(onRangeChange.mock.calls[0][0].end.getDate()).toBe(14);

    rerender(
      withProvider(
        <DateField
          label="Stay"
          mode="range"
          range={{ start: new Date(2024, 2, 10), end: new Date(2024, 2, 14) }}
          onRangeChange={onRangeChange}
        />
      )
    );
    expect(screen.getByText('March 10, 2024 — March 14, 2024')).toBeOnTheScreen();
  });

  it('shows an error message', () => {
    render(withProvider(<DateField label="Due date" onChange={() => {}} error="Required" />));
    expect(screen.getByText('Required')).toBeOnTheScreen();
  });

  it('does not open when disabled', () => {
    render(withProvider(<DateField label="Due date" onChange={() => {}} disabled />));
    fireEvent.press(screen.getByRole('button', { name: 'Due date' }));
    expect(screen.queryByRole('button', { name: 'Previous month' })).not.toBeOnTheScreen();
  });
});
