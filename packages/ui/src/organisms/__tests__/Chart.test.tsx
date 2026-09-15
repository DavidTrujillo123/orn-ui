import React, { useState } from 'react';
import { act, fireEvent, render, screen, within } from '@testing-library/react-native';
import { UIProvider } from '../../theme/UIProvider';
import { Chart, type ChartRow, type ChartSelection } from '../Chart';
import type { ReactTestRendererJSON } from 'react-test-renderer';
import { Bar, Dot, Polyline, Wedge } from '../chart/marks';

const ROWS: ChartRow[] = [
  { x: 'Jan', sales: 120, costs: 80 },
  { x: 'Feb', sales: 180, costs: 90 },
  { x: 'Mar', sales: 90, costs: 110 },
];

const SERIES = [
  { key: 'sales', label: 'Sales' },
  { key: 'costs', label: 'Costs' },
];

function withProvider(children: React.ReactNode) {
  return <UIProvider mode="light">{children}</UIProvider>;
}

/**
 * jsdom no hace layout: sin este evento el plot mide 0 y no dibuja nada, que
 * es exactamente lo que hace el componente en un ancho desconocido.
 */
function layout(testID = 'c-plot', width = 320, height = 220) {
  fireEvent(screen.getByTestId(testID), 'layout', { nativeEvent: { layout: { width, height, x: 0, y: 0 } } });
}

function pressBand(index: number, locationY = 10) {
  fireEvent.press(screen.getByTestId(`c-band-${index}`), { nativeEvent: { locationX: 10, locationY } });
}

describe('Chart', () => {
  // Las barras llegan a su alto con Animated.timing: sin fake timers siguen
  // agendando frames contra un árbol ya desmontado.
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => {
    act(() => jest.runOnlyPendingTimers());
    jest.useRealTimers();
  });

  it('draws nothing until it knows how wide it is', () => {
    render(withProvider(<Chart type="bar" data={ROWS} series={SERIES} accessibilityLabel="Sales" testID="c" />));
    expect(screen.queryByTestId('c-bar-0-sales')).toBeNull();
    act(() => layout());
    expect(screen.getByTestId('c-bar-0-sales')).toBeOnTheScreen();
  });

  describe('bar', () => {
    it('draws one bar per row and series, grouped side by side', () => {
      render(withProvider(<Chart type="bar" data={ROWS} series={SERIES} accessibilityLabel="Sales" testID="c" />));
      act(() => layout());
      expect(screen.getAllByTestId(/^c-bar-\d-(sales|costs)$/)).toHaveLength(6);
      // Agrupadas: la de costs empieza a la derecha de la de sales.
      const sales = screen.getByTestId('c-bar-0-sales');
      const costs = screen.getByTestId('c-bar-0-costs');
      expect(costs.props.style.left).toBeGreaterThan(sales.props.style.left);
    });

    it('stacked puts both series on the same slot', () => {
      render(withProvider(<Chart type="bar" stacked data={ROWS} series={SERIES} accessibilityLabel="Sales" testID="c" />));
      act(() => layout());
      expect(screen.getByTestId('c-bar-0-costs').props.style.left).toBe(screen.getByTestId('c-bar-0-sales').props.style.left);
    });

    it('horizontal swaps which axis carries the categories', () => {
      render(
        withProvider(<Chart type="bar" orientation="horizontal" data={ROWS} series={[SERIES[0]!]} accessibilityLabel="Sales" testID="c" />)
      );
      act(() => layout());
      const bar = screen.getByTestId('c-bar-1-sales');
      // Crece desde la izquierda: la posición fija es `left`, no `bottom`.
      expect(bar.props.style.left).toBeDefined();
      expect(screen.getByTestId('c-band-1').props.style.width).toBe(320 - 64);
    });

    it('a negative value grows the other way from the baseline', () => {
      render(
        withProvider(
          <Chart type="bar" data={[{ x: 'Jan', sales: -50 }, { x: 'Feb', sales: 50 }]} series={[SERIES[0]!]} accessibilityLabel="Net" testID="c" />
        )
      );
      act(() => layout());
      expect(screen.getByTestId('c-bar-0-sales').props.style.top).toBeDefined();
      expect(screen.getByTestId('c-bar-1-sales').props.style.bottom).toBeDefined();
    });

    it('rounds the free end of the bar, whichever end that is', () => {
      const { rerender } = render(
        withProvider(
          <Chart type="bar" barRadius={6} data={[{ x: 'a', v: 10 }, { x: 'b', v: -10 }]} series={[{ key: 'v' }]} accessibilityLabel="Net" testID="c" />
        )
      );
      act(() => layout());
      expect(screen.getByTestId('c-bar-0-v').props.style.borderTopLeftRadius).toBe(6);
      expect(screen.getByTestId('c-bar-1-v').props.style.borderBottomLeftRadius).toBe(6);

      act(() => {
        rerender(
          withProvider(
            <Chart
              type="bar"
              orientation="horizontal"
              barRadius={6}
              data={[{ x: 'a', v: 10 }, { x: 'b', v: -10 }]}
              series={[{ key: 'v' }]}
              accessibilityLabel="Net"
              testID="c"
            />
          )
        );
      });
      act(() => layout());
      // Positiva crece hacia la derecha, negativa hacia la izquierda: el
      // extremo redondeado cambia de lado con el signo.
      expect(screen.getByTestId('c-bar-0-v').props.style.borderTopRightRadius).toBe(6);
      expect(screen.getByTestId('c-bar-1-v').props.style.borderTopLeftRadius).toBe(6);
      expect(screen.getByTestId('c-bar-1-v').props.style.right).toBeDefined();
    });

    it('barRadius={0} leaves the corners square', () => {
      render(withProvider(<Chart type="bar" barRadius={0} data={ROWS} series={[SERIES[0]!]} accessibilityLabel="Sales" testID="c" />));
      act(() => layout());
      expect(screen.getByTestId('c-bar-0-sales').props.style.borderTopLeftRadius).toBeUndefined();
    });

    it('animate={false} puts the bar at its size with no timing', () => {
      render(withProvider(<Chart type="bar" animate={false} data={ROWS} series={[SERIES[0]!]} accessibilityLabel="Sales" testID="c" />));
      act(() => layout());
      expect(screen.getByTestId('c-bar-0-sales')).toBeOnTheScreen();
    });
  });

  describe('line and area', () => {
    it('line draws a dot per point and a polyline per series', () => {
      render(withProvider(<Chart type="line" data={ROWS} series={SERIES} accessibilityLabel="Sales" testID="c" />));
      act(() => layout());
      expect(screen.getByTestId('c-line-sales')).toBeOnTheScreen();
      expect(screen.getAllByTestId(/^c-dot-sales-\d$/)).toHaveLength(3);
    });

    it('a hole in a series just skips that point', () => {
      render(
        withProvider(
          <Chart type="line" data={[{ x: 'a', v: 1 }, { x: 'b', v: null }, { x: 'c', v: 3 }]} series={[{ key: 'v' }]} accessibilityLabel="V" testID="c" />
        )
      );
      act(() => layout());
      expect(screen.getAllByTestId(/^c-dot-v-\d$/)).toHaveLength(2);
    });

    it('smooth adds samples between the points without moving them', () => {
      render(withProvider(<Chart type="line" smooth dots={false} data={ROWS} series={[SERIES[0]!]} accessibilityLabel="Sales" testID="c" />));
      act(() => layout());
      expect(screen.getByTestId('c-line-sales').props.children.length).toBeGreaterThan(2);
    });

    it('area keeps the line and fills under it', () => {
      render(withProvider(<Chart type="area" data={ROWS} series={[SERIES[0]!]} accessibilityLabel="Sales" testID="c" />));
      act(() => layout());
      expect(screen.getByTestId('c-line-sales')).toBeOnTheScreen();
      expect(screen.queryAllByTestId(/^c-dot-/)).toHaveLength(0);
    });

    it('stacked area lifts the second series onto the first', () => {
      render(withProvider(<Chart type="area" stacked data={ROWS} series={SERIES} accessibilityLabel="Sales" testID="c" />));
      act(() => layout());
      expect(screen.getByTestId('c-line-costs')).toBeOnTheScreen();
    });
  });

  describe('pie and donut', () => {
    it('draws a slice per row', () => {
      render(withProvider(<Chart type="pie" data={ROWS} series={[SERIES[0]!]} accessibilityLabel="Share" testID="c" />));
      act(() => layout());
      expect(screen.getAllByTestId(/^c-slice-\d$/)).toHaveLength(3);
      expect(screen.getByTestId('c-slice-label-0')).toBeOnTheScreen();
    });

    it('sliceLabels="value" writes the number instead of the share', () => {
      render(
        withProvider(<Chart type="pie" sliceLabels="value" data={ROWS} series={[SERIES[0]!]} accessibilityLabel="Share" testID="c" />)
      );
      act(() => layout());
      expect(screen.getByText('120')).toBeOnTheScreen();
    });

    it('sliceLabels="none" writes nothing', () => {
      render(
        withProvider(<Chart type="pie" sliceLabels="none" data={ROWS} series={[SERIES[0]!]} accessibilityLabel="Share" testID="c" />)
      );
      act(() => layout());
      expect(screen.queryByTestId('c-slice-label-0')).toBeNull();
    });

    it('a slice too thin to hold a label does not get one', () => {
      render(
        withProvider(
          <Chart type="pie" data={[{ x: 'Big', v: 1000 }, { x: 'Sliver', v: 1 }]} series={[{ key: 'v' }]} accessibilityLabel="Share" testID="c" />
        )
      );
      act(() => layout());
      expect(screen.queryByTestId('c-slice-label-1')).toBeNull();
    });

    it('a slice past half the circle is drawn as two halves', () => {
      render(
        withProvider(<Chart type="pie" data={[{ x: 'Most', v: 3 }, { x: 'Rest', v: 1 }]} series={[{ key: 'v' }]} accessibilityLabel="Share" testID="c" />)
      );
      act(() => layout());
      // 270°: una mitad llena más otra de 90°, dentro de la misma porción.
      expect(screen.getByTestId('c-slice-0').props.children.filter(Boolean)).toHaveLength(2);
      expect(screen.getByTestId('c-slice-1').props.children.filter(Boolean)).toHaveLength(1);
    });

    it('nothing to slice draws nothing', () => {
      render(
        withProvider(<Chart type="pie" data={[{ x: 'a', v: 0 }, { x: 'b', v: 0 }]} series={[{ key: 'v' }]} accessibilityLabel="Share" testID="c" />)
      );
      act(() => layout());
      expect(screen.queryByTestId('c-slice-0')).toBeNull();
    });

    it('a tap on a slice selects it, and one in the hole lets it go', () => {
      const onSelect = jest.fn();
      render(
        withProvider(<Chart type="donut" data={ROWS} series={[SERIES[0]!]} onSelect={onSelect} accessibilityLabel="Share" testID="c" />)
      );
      act(() => layout());
      // Arriba y un poco a la derecha del centro: la primera porción.
      fireEvent.press(screen.getByTestId('c-hit'), { nativeEvent: { locationX: 200, locationY: 50 } });
      expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ index: 0, label: 'Jan' }));

      fireEvent.press(screen.getByTestId('c-hit'), { nativeEvent: { locationX: 160, locationY: 110 } });
      expect(onSelect).toHaveBeenLastCalledWith(null);
    });
  });

  describe('radar', () => {
    it('draws a closed outline and one label per axis', () => {
      render(withProvider(<Chart type="radar" data={ROWS} series={SERIES} accessibilityLabel="Profile" testID="c" />));
      act(() => layout());
      expect(screen.getByTestId('c-outline-sales')).toBeOnTheScreen();
      expect(screen.getAllByTestId(/^c-axis-\d$/)).toHaveLength(3);
    });

    it('fill={false} leaves only the outline', () => {
      const { rerender } = render(
        withProvider(<Chart type="radar" data={ROWS} series={[SERIES[0]!]} accessibilityLabel="Profile" testID="c" />)
      );
      act(() => layout());
      expect(screen.getByTestId('c-fill-sales').props.children.length).toBeGreaterThan(0);

      act(() => {
        rerender(withProvider(<Chart type="radar" fill={false} data={ROWS} series={[SERIES[0]!]} accessibilityLabel="Profile" testID="c" />));
      });
      act(() => layout());
      expect(screen.queryByTestId('c-fill-sales')).toBeNull();
      expect(screen.getByTestId('c-outline-sales')).toBeOnTheScreen();
    });

    it('a tap picks the nearest axis', () => {
      const onSelect = jest.fn();
      render(
        withProvider(<Chart type="radar" data={ROWS} series={[SERIES[0]!]} onSelect={onSelect} accessibilityLabel="Profile" testID="c" />)
      );
      act(() => layout());
      fireEvent.press(screen.getByTestId('c-hit'), { nativeEvent: { locationX: 160, locationY: 20 } });
      expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ index: 0 }));
    });
  });

  describe('legend as a filter', () => {
    it('shows one entry per series and hides the one that is tapped', () => {
      render(withProvider(<Chart type="bar" data={ROWS} series={SERIES} accessibilityLabel="Sales" testID="c" />));
      act(() => layout());
      expect(screen.getAllByTestId(/^c-bar-\d-costs$/)).toHaveLength(3);

      fireEvent.press(screen.getByTestId('c-legend-costs'));
      expect(screen.queryAllByTestId(/^c-bar-\d-costs$/)).toHaveLength(0);
      expect(screen.getAllByTestId(/^c-bar-\d-sales$/)).toHaveLength(3);

      fireEvent.press(screen.getByTestId('c-legend-costs'));
      expect(screen.getAllByTestId(/^c-bar-\d-costs$/)).toHaveLength(3);
    });

    it('reports the change and obeys hiddenKeys when it is controlled', () => {
      const onChange = jest.fn();
      render(
        withProvider(
          <Chart type="bar" hiddenKeys={['costs']} onHiddenKeysChange={onChange} data={ROWS} series={SERIES} accessibilityLabel="Sales" testID="c" />
        )
      );
      act(() => layout());
      expect(screen.queryAllByTestId(/^c-bar-\d-costs$/)).toHaveLength(0);

      fireEvent.press(screen.getByTestId('c-legend-costs'));
      expect(onChange).toHaveBeenCalledWith([]);
      // Controlado: sigue oculto hasta que el padre cambie la prop.
      expect(screen.queryAllByTestId(/^c-bar-\d-costs$/)).toHaveLength(0);
    });

    it('in a pie the legend lists the rows, because that is where the categories are', () => {
      render(withProvider(<Chart type="pie" data={ROWS} series={[SERIES[0]!]} accessibilityLabel="Share" testID="c" />));
      act(() => layout());
      expect(screen.getByTestId('c-legend-Jan')).toBeOnTheScreen();
      fireEvent.press(screen.getByTestId('c-legend-Jan'));
      expect(screen.queryByTestId('c-slice-0')).toBeNull();
      expect(screen.getByTestId('c-slice-1')).toBeOnTheScreen();
    });

    it('legend="none" drops it, legend="static" keeps it without the toggle', () => {
      const { rerender } = render(
        withProvider(<Chart type="bar" legend="none" data={ROWS} series={SERIES} accessibilityLabel="Sales" testID="c" />)
      );
      act(() => layout());
      expect(screen.queryByTestId('c-legend')).toBeNull();

      act(() => {
        rerender(withProvider(<Chart type="bar" legend="static" data={ROWS} series={SERIES} accessibilityLabel="Sales" testID="c" />));
      });
      act(() => layout());
      fireEvent.press(screen.getByTestId('c-legend-costs'));
      expect(screen.getAllByTestId(/^c-bar-\d-costs$/)).toHaveLength(3);
    });

    it('hiding every series leaves the empty message', () => {
      render(withProvider(<Chart type="bar" hiddenKeys={['sales', 'costs']} data={ROWS} series={SERIES} accessibilityLabel="Sales" testID="c" />));
      act(() => layout());
      expect(screen.getByTestId('c-empty')).toBeOnTheScreen();
    });
  });

  describe('selection and tooltip', () => {
    it('a tap on a band opens the tooltip with every visible series', () => {
      render(withProvider(<Chart type="bar" data={ROWS} series={SERIES} accessibilityLabel="Sales" testID="c" />));
      act(() => layout());
      pressBand(1);
      const tooltip = within(screen.getByTestId('c-tooltip'));
      expect(tooltip.getByText('Feb')).toBeOnTheScreen();
      expect(tooltip.getByText('180')).toBeOnTheScreen();
      expect(tooltip.getByText('90')).toBeOnTheScreen();
    });

    it('tapping the same point again lets it go', () => {
      const onSelect = jest.fn();
      render(withProvider(<Chart type="bar" data={ROWS} series={[SERIES[0]!]} onSelect={onSelect} accessibilityLabel="Sales" testID="c" />));
      act(() => layout());
      pressBand(0);
      expect(onSelect).toHaveBeenLastCalledWith(expect.objectContaining({ index: 0, seriesKey: 'sales' }));
      pressBand(0);
      expect(onSelect).toHaveBeenLastCalledWith(null);
      expect(screen.queryByTestId('c-tooltip')).toBeNull();
    });

    it('picks the series whose mark is closest to the finger', () => {
      const onSelect = jest.fn();
      render(withProvider(<Chart type="bar" data={ROWS} series={SERIES} onSelect={onSelect} accessibilityLabel="Sales" testID="c" />));
      act(() => layout());
      // Arriba del todo: la serie alta (sales). Abajo: la baja (costs).
      pressBand(0, 0);
      expect(onSelect).toHaveBeenLastCalledWith(expect.objectContaining({ seriesKey: 'sales' }));
      pressBand(1, 220);
      expect(onSelect).toHaveBeenLastCalledWith(expect.objectContaining({ seriesKey: 'costs' }));
    });

    it('dims everything that is not the selected category', () => {
      render(withProvider(<Chart type="bar" data={ROWS} series={[SERIES[0]!]} accessibilityLabel="Sales" testID="c" />));
      act(() => layout());
      pressBand(0);
      expect(screen.getByTestId('c-bar-0-sales').props.style.opacity).toBe(1);
      expect(screen.getByTestId('c-bar-1-sales').props.style.opacity).toBeLessThan(1);
    });

    it('selected can come from outside', () => {
      const selection: ChartSelection = { id: '2', index: 2, row: ROWS[2]!, label: 'Mar', seriesKey: 'sales', value: 90 };
      render(
        withProvider(<Chart type="bar" selected={selection} data={ROWS} series={[SERIES[0]!]} accessibilityLabel="Sales" testID="c" />)
      );
      act(() => layout());
      expect(within(screen.getByTestId('c-tooltip')).getByText('Mar')).toBeOnTheScreen();
    });

    it('tooltip={false} keeps the selection and drops the balloon', () => {
      render(withProvider(<Chart type="bar" tooltip={false} data={ROWS} series={SERIES} accessibilityLabel="Sales" testID="c" />));
      act(() => layout());
      pressBand(1);
      expect(screen.queryByTestId('c-tooltip')).toBeNull();
    });

    it('a band tells a screen reader its category and its numbers', () => {
      render(withProvider(<Chart type="bar" data={ROWS} series={SERIES} accessibilityLabel="Sales" testID="c" />));
      act(() => layout());
      expect(screen.getByTestId('c-band-0')).toHaveProp('accessibilityLabel', 'Jan, Sales 120, Costs 80');
    });
  });

  describe('frame', () => {
    it('writes the value ticks and the category labels', () => {
      render(withProvider(<Chart type="bar" data={ROWS} series={[SERIES[0]!]} accessibilityLabel="Sales" testID="c" />));
      act(() => layout());
      expect(screen.getByTestId('c-y-axis')).toBeOnTheScreen();
      expect(screen.getByTestId('c-x-axis')).toBeOnTheScreen();
      expect(screen.getByText('Feb')).toBeOnTheScreen();
    });

    it('grid, xAxis and yAxis can all be turned off', () => {
      render(
        withProvider(
          <Chart type="bar" grid={false} xAxis={false} yAxis={false} data={ROWS} series={[SERIES[0]!]} accessibilityLabel="Sales" testID="c" />
        )
      );
      act(() => layout());
      expect(screen.queryByTestId('c-grid')).toBeNull();
      expect(screen.queryByTestId('c-x-axis')).toBeNull();
      expect(screen.queryByTestId('c-y-axis')).toBeNull();
      // Sin canal a la izquierda la banda ocupa el ancho entero.
      expect(screen.getByTestId('c-band-0').props.style.width).toBeCloseTo(320 / 3);
    });

    it('the value gutter widens for a long formatValue instead of truncating it', () => {
      const { rerender } = render(
        withProvider(<Chart type="bar" data={ROWS} series={[SERIES[0]!]} accessibilityLabel="Sales" testID="c" />)
      );
      act(() => layout());
      // Con el formato compacto ("200") alcanza el piso de 38px.
      const compact = screen.getByTestId('c-band-0').props.style.width;

      act(() => {
        rerender(
          withProvider(
            <Chart
              type="bar"
              formatValue={(value) => `$${value * 100}`}
              data={ROWS}
              series={[SERIES[0]!]}
              accessibilityLabel="Sales"
              testID="c"
            />
          )
        );
      });
      // "$20000" no entra en 38px: el canal crece y el plot se angosta.
      expect(screen.getByTestId('c-band-0').props.style.width).toBeLessThan(compact);
    });

    it('the gutter never eats more than a third of the width', () => {
      render(
        withProvider(
          <Chart
            type="bar"
            formatValue={() => 'a very long label indeed'}
            data={ROWS}
            series={[SERIES[0]!]}
            accessibilityLabel="Sales"
            testID="c"
          />
        )
      );
      act(() => layout());
      expect(screen.getByTestId('c-band-0').props.style.width).toBeGreaterThanOrEqual((320 * 0.7) / 3 - 1);
    });

    it('formatValue reaches the axis and the tooltip', () => {
      render(
        withProvider(
          <Chart type="bar" formatValue={(value) => `$${value}`} data={ROWS} series={[SERIES[0]!]} accessibilityLabel="Sales" testID="c" />
        )
      );
      act(() => layout());
      pressBand(0);
      expect(within(screen.getByTestId('c-tooltip')).getByText('$120')).toBeOnTheScreen();
    });

    it('marks the zero line when the data crosses it', () => {
      render(
        withProvider(
          <Chart type="bar" data={[{ x: 'a', v: -10 }, { x: 'b', v: 10 }]} series={[{ key: 'v' }]} accessibilityLabel="Net" testID="c" />
        )
      );
      act(() => layout());
      expect(screen.getByTestId('c-grid')).toBeOnTheScreen();
    });
  });

  describe('filters', () => {
    it('renders one control per filter and reports the change', () => {
      const onChange = jest.fn();
      render(
        withProvider(
          <Chart
            type="bar"
            data={ROWS}
            series={[SERIES[0]!]}
            filters={[
              {
                key: 'range',
                value: 'week',
                onChange,
                options: [
                  { value: 'week', label: 'Week' },
                  { value: 'month', label: 'Month' },
                ],
              },
            ]}
            accessibilityLabel="Sales"
            testID="c"
          />
        )
      );
      act(() => layout());
      fireEvent.press(screen.getByTestId('c-filter-range-month'));
      expect(onChange).toHaveBeenCalledWith('month');
    });

    it('the data it gets back is the data it draws', () => {
      function Filtered() {
        const [range, setRange] = useState('all');
        const rows = range === 'all' ? ROWS : ROWS.slice(0, 1);
        return (
          <Chart
            type="bar"
            data={rows}
            series={[SERIES[0]!]}
            filters={[
              {
                key: 'range',
                value: range,
                onChange: setRange,
                options: [
                  { value: 'all', label: 'All' },
                  { value: 'one', label: 'One' },
                ],
              },
            ]}
            accessibilityLabel="Sales"
            testID="c"
          />
        );
      }
      render(withProvider(<Filtered />));
      act(() => layout());
      expect(screen.getAllByTestId(/^c-bar-\d-sales$/)).toHaveLength(3);
      fireEvent.press(screen.getByTestId('c-filter-range-one'));
      expect(screen.getAllByTestId(/^c-bar-\d-sales$/)).toHaveLength(1);
    });
  });

  describe('live data', () => {
    const TICKS: ChartRow[] = Array.from({ length: 10 }, (_, index) => ({ x: `t${index}`, v: index * 10 }));
    const V = [{ key: 'v', label: 'V' }];

    it('domain fixes the axis instead of letting the data set it', () => {
      render(withProvider(<Chart type="bar" domain={[0, 400]} data={ROWS} series={[SERIES[0]!]} accessibilityLabel="Sales" testID="c" />));
      act(() => layout());
      // Sin domain el eje sería 0–200 en pasos de 50 (máximo del dato: 180).
      // Con él es 0–400 en pasos de 100, exacto y sin redondear.
      expect(screen.getByText('400')).toBeOnTheScreen();
      expect(screen.getByText('300')).toBeOnTheScreen();
      expect(screen.queryByText('150')).toBeNull();
    });

    it('domain="sticky" grows with a peak and never gives the room back', () => {
      const tall = [{ x: 'a', v: 180 }];
      const short = [{ x: 'a', v: 20 }];
      const { rerender } = render(
        withProvider(<Chart type="bar" domain="sticky" data={tall} series={V} accessibilityLabel="V" testID="c" />)
      );
      act(() => layout());
      expect(screen.getByText('200')).toBeOnTheScreen();

      act(() => {
        rerender(withProvider(<Chart type="bar" domain="sticky" data={short} series={V} accessibilityLabel="V" testID="c" />));
      });
      expect(screen.getByText('200')).toBeOnTheScreen();
    });

    it('without sticky the axis follows the data down', () => {
      const { rerender } = render(
        withProvider(<Chart type="bar" data={[{ x: 'a', v: 180 }]} series={V} accessibilityLabel="V" testID="c" />)
      );
      act(() => layout());
      expect(screen.getByText('200')).toBeOnTheScreen();

      act(() => {
        rerender(withProvider(<Chart type="bar" data={[{ x: 'a', v: 20 }]} series={V} accessibilityLabel="V" testID="c" />));
      });
      expect(screen.queryByText('200')).toBeNull();
    });

    it('window draws only the last N rows', () => {
      render(withProvider(<Chart type="bar" window={3} data={TICKS} series={V} accessibilityLabel="V" testID="c" />));
      act(() => layout());
      expect(screen.getAllByTestId(/^c-band-\d$/)).toHaveLength(3);
      expect(screen.getByText('t9')).toBeOnTheScreen();
      expect(screen.queryByText('t0')).toBeNull();
    });

    it('decimate thins a line down to the count asked for', () => {
      render(withProvider(<Chart type="line" decimate={4} data={TICKS} series={V} accessibilityLabel="V" testID="c" />));
      act(() => layout());
      expect(screen.getAllByTestId(/^c-dot-v-\d$/)).toHaveLength(4);
    });

    it('decimate={false} draws every point', () => {
      render(withProvider(<Chart type="line" decimate={false} data={TICKS} series={V} accessibilityLabel="V" testID="c" />));
      act(() => layout());
      expect(screen.getAllByTestId(/^c-dot-v-\d$/)).toHaveLength(10);
    });

    it('with no decimate given, the measured width sets the cap', () => {
      // 20px de ancho ⇒ un punto cada dos píxeles ⇒ 10 puntos como mucho.
      render(
        withProvider(
          <Chart type="line" data={Array.from({ length: 80 }, (_, i) => ({ x: `t${i}`, v: i }))} series={V} accessibilityLabel="V" testID="c" />
        )
      );
      act(() => layout('c-plot', 20, 220));
      expect(screen.getAllByTestId(/^c-dot-v-\d$/)).toHaveLength(10);
    });

    it('bars are never thinned: a bar that is not there reads as no data, not as fewer pixels', () => {
      render(withProvider(<Chart type="bar" data={TICKS} series={V} accessibilityLabel="V" testID="c" />));
      act(() => layout('c-plot', 20, 220));
      expect(screen.getAllByTestId(/^c-bar-\d-v$/)).toHaveLength(10);
    });

    it('selectBy keeps the highlight on its row while the window slides', () => {
      const rows = [
        { x: 'a', v: 1 },
        { x: 'b', v: 2 },
        { x: 'c', v: 3 },
      ];
      const selectBy = (row: ChartRow) => String(row.x);
      const { rerender } = render(
        withProvider(<Chart type="bar" selectBy={selectBy} data={rows} series={V} accessibilityLabel="V" testID="c" />)
      );
      act(() => layout());
      pressBand(1);
      expect(within(screen.getByTestId('c-tooltip')).getByText('b')).toBeOnTheScreen();

      // Corre la ventana: 'b' pasa del índice 1 al 0 y el resaltado lo sigue.
      act(() => {
        rerender(withProvider(<Chart type="bar" selectBy={selectBy} data={rows.slice(1)} series={V} accessibilityLabel="V" testID="c" />));
      });
      expect(within(screen.getByTestId('c-tooltip')).getByText('b')).toBeOnTheScreen();
      expect(screen.getByTestId('c-bar-0-v').props.style.opacity).toBe(1);
      expect(screen.getByTestId('c-bar-1-v').props.style.opacity).toBeLessThan(1);

      // Y cuando 'b' sale de la ventana, el resaltado se va con él.
      act(() => {
        rerender(withProvider(<Chart type="bar" selectBy={selectBy} data={rows.slice(2)} series={V} accessibilityLabel="V" testID="c" />));
      });
      expect(screen.queryByTestId('c-tooltip')).toBeNull();
    });

    it('without selectBy the highlight stays on the index, which is the slot and not the datum', () => {
      const { rerender } = render(
        withProvider(<Chart type="bar" data={ROWS} series={[SERIES[0]!]} accessibilityLabel="Sales" testID="c" />)
      );
      act(() => layout());
      pressBand(1);
      expect(within(screen.getByTestId('c-tooltip')).getByText('Feb')).toBeOnTheScreen();

      act(() => {
        rerender(withProvider(<Chart type="bar" data={ROWS.slice(1)} series={[SERIES[0]!]} accessibilityLabel="Sales" testID="c" />));
      });
      expect(within(screen.getByTestId('c-tooltip')).getByText('Mar')).toBeOnTheScreen();
    });

    it('the selection carries its id and the row itself, so no index math is needed', () => {
      const onSelect = jest.fn();
      render(
        withProvider(
          <Chart
            type="bar"
            selectBy={(row) => `id-${row.x}`}
            onSelect={onSelect}
            data={ROWS}
            series={[SERIES[0]!]}
            accessibilityLabel="Sales"
            testID="c"
          />
        )
      );
      act(() => layout());
      pressBand(2);
      expect(onSelect).toHaveBeenLastCalledWith({
        id: 'id-Mar',
        index: 2,
        row: ROWS[2],
        label: 'Mar',
        seriesKey: 'sales',
        value: 90,
      });
    });
  });

  it('no data shows the empty message, and emptyText replaces it', () => {
    const { rerender } = render(withProvider(<Chart type="bar" data={[]} series={SERIES} accessibilityLabel="Sales" testID="c" />));
    act(() => layout());
    expect(screen.getByTestId('c-empty')).toBeOnTheScreen();

    rerender(withProvider(<Chart type="bar" data={[]} series={SERIES} emptyText="Nothing yet" accessibilityLabel="Sales" testID="c" />));
    expect(screen.getByText('Nothing yet')).toBeOnTheScreen();
  });

  it('the plot is what a screen reader reads, with the label it was given', () => {
    render(withProvider(<Chart type="bar" data={ROWS} series={SERIES} accessibilityLabel="Sales per month" testID="c" />));
    expect(screen.getByTestId('c-plot')).toHaveProp('accessibilityLabel', 'Sales per month');
  });

  it('a series can bring its own color', () => {
    render(
      withProvider(
        <Chart type="bar" data={ROWS} series={[{ key: 'sales', label: 'Sales', color: '#ff0000' }]} accessibilityLabel="Sales" testID="c" />
      )
    );
    act(() => layout());
    expect(screen.getByTestId('c-bar-0-sales').props.style.backgroundColor).toBe('#ff0000');
  });

  it('works without a testID', () => {
    const tree = render(withProvider(<Chart type="line" data={ROWS} series={SERIES} accessibilityLabel="Sales" />));
    expect(tree.toJSON()).toBeTruthy();
  });

  it('renders in dark mode too', () => {
    render(
      <UIProvider mode="dark">
        <Chart type="donut" data={ROWS} series={[SERIES[0]!]} accessibilityLabel="Share" testID="c" />
      </UIProvider>
    );
    act(() => layout());
    expect(screen.getAllByTestId(/^c-slice-\d$/)).toHaveLength(3);
  });
});

/**
 * Las primitivas se prueban aparte de los charts: sus casos de borde (una
 * porción de 0°, una línea de un punto) no se alcanzan desde datos reales
 * porque Chart los filtra antes, pero un consumidor con `npx orn-ui add` sí
 * puede llegar a ellos.
 */
describe('chart/marks', () => {
  it('a polyline needs two points to have something to draw', () => {
    render(withProvider(<Polyline points={[{ x: 0, y: 0 }]} color="#000000" testID="p" />));
    expect(screen.queryByTestId('p')).toBeNull();
  });

  it('closed joins the last point back to the first', () => {
    const points = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 10 },
    ];
    const open = render(withProvider(<Polyline points={points} color="#000000" testID="p" />));
    const openSegments = screen.getByTestId('p').props.children.length;
    open.unmount();

    render(withProvider(<Polyline points={points} color="#000000" closed testID="p" />));
    expect(screen.getByTestId('p').props.children.length).toBe(openSegments + 1);
  });

  it('a wedge with no opening and one with no size draw nothing', () => {
    render(
      withProvider(
        <>
          <Wedge size={100} start={0} sweep={0} color="#000000" testID="w1" />
          <Wedge size={0} start={0} sweep={90} color="#000000" testID="w2" />
        </>
      )
    );
    expect(screen.queryByTestId('w1')).toBeNull();
    expect(screen.queryByTestId('w2')).toBeNull();
  });

  it('a wedge narrower than half the circle is half a disc, not a whole one', () => {
    // La regresión que esto ataja: con un disco entero adentro del recorte, la
    // rotación no cambia nada —un círculo sólido girado es el mismo círculo— y
    // toda porción sale de 180°, sea de 5° o de 179°.
    const tree = render(withProvider(<Wedge size={100} start={0} sweep={30} color="#000000" testID="w" />)).toJSON();
    // recorte a la mitad derecha -> cuadrado que gira -> medio disco
    const clip = (tree as ReactTestRendererJSON).children![0] as ReactTestRendererJSON;
    const spinner = clip.children![0] as ReactTestRendererJSON;
    const disc = spinner.children![0] as ReactTestRendererJSON;

    expect(clip.props.style.overflow).toBe('hidden');
    expect(spinner.props.style.transform).toEqual([{ rotate: '-150deg' }]);
    expect(disc.props.style.width).toBe(50);
    expect(disc.props.style.borderTopRightRadius).toBe(50);
    expect(disc.props.style.borderTopLeftRadius).toBeUndefined();
  });

  it('a dot without a ring has no border', () => {
    render(withProvider(<Dot point={{ x: 5, y: 5 }} color="#000000" testID="d" />));
    expect(screen.getByTestId('d').props.style.borderWidth).toBe(0);
  });

  it('a bar defaults to square corners and grows on its own', () => {
    render(withProvider(<Bar x={0} y={0} width={10} height={20} color="#000000" from="bottom" testID="b" />));
    expect(screen.getByTestId('b').props.style.borderTopLeftRadius).toBeUndefined();
  });
});
