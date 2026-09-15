import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import { Body, Card, Chart, type ChartRow, type ChartSelection } from 'orn-ui';
import { VariantList, type VariantDef } from '@/components/VariantList';

const MONTHS: ChartRow[] = [
  { x: 'Jan', sales: 1200, costs: 800 },
  { x: 'Feb', sales: 1800, costs: 900 },
  { x: 'Mar', sales: 900, costs: 1100 },
  { x: 'Apr', sales: 2100, costs: 1250 },
  { x: 'May', sales: 1600, costs: 700 },
  { x: 'Jun', sales: 2400, costs: 1500 },
];

const SERIES = [
  { key: 'sales', label: 'Sales' },
  { key: 'costs', label: 'Costs' },
];

const SHARE: ChartRow[] = [
  { x: 'iOS', users: 4200 },
  { x: 'Android', users: 5600 },
  { x: 'Web', users: 1800 },
  { x: 'Desktop', users: 600 },
];

const SKILLS: ChartRow[] = [
  { x: 'Speed', mine: 8, theirs: 5 },
  { x: 'Memory', mine: 6, theirs: 9 },
  { x: 'Size', mine: 9, theirs: 4 },
  { x: 'API', mine: 7, theirs: 7 },
  { x: 'Docs', mine: 5, theirs: 8 },
];

const NET: ChartRow[] = [
  { x: 'Q1', net: 320 },
  { x: 'Q2', net: -180 },
  { x: 'Q3', net: 260 },
  { x: 'Q4', net: -90 },
];

const RANGES = [
  { value: '3', label: '3 months' },
  { value: '6', label: '6 months' },
];

/**
 * Un chart de verdad: filtro de rango arriba, leyenda que apaga series y un
 * eco de la selección debajo. El eco existe para el flow de Maestro — la
 * barra resaltada y el globo son píxeles, y un assert no los ve.
 */
function Interactive() {
  const [range, setRange] = useState('6');
  const [picked, setPicked] = useState<ChartSelection | null>(null);
  const rows = useMemo(() => MONTHS.slice(-Number(range)), [range]);

  // Cambiar el rango suelta la selección: el mes elegido puede no estar en el
  // recorte nuevo, y dejar el eco hablando de un mes que ya no se ve miente.
  const changeRange = (next: string) => {
    setRange(next);
    setPicked(null);
  };

  return (
    <View style={{ gap: 12 }}>
      <Card>
        <Chart
          type="bar"
          data={rows}
          series={SERIES}
          onSelect={setPicked}
          formatValue={(value) => `$${value}`}
          filters={[{ key: 'range', value: range, onChange: changeRange, options: RANGES }]}
          accessibilityLabel="Sales and costs per month"
          testID="chart-interactive"
        />
      </Card>
      <Body>{picked ? `${picked.label}: ${picked.seriesKey} $${picked.value}` : 'Tap a month'}</Body>
    </View>
  );
}

/**
 * Datos que llegan solos, que es lo que hace un WebSocket o un SSE: acá el
 * que empuja es un `setInterval` porque un demo no debería depender de una
 * red, pero el cableado con Chart es el mismo — `setRows` y nada más.
 *
 * Las tres props que hacen que un chart en vivo se lea:
 * - `window`, la ventana deslizante;
 * - `domain="sticky"`, para que el eje no se reacomode en cada tick y haga
 *   saltar la línea aunque el dato no se haya movido;
 * - `selectBy`, para que el punto elegido siga a su dato mientras la ventana
 *   corre, en vez de quedarse pegado a un índice que ya es de otro.
 */
function LiveChart() {
  const [rows, setRows] = useState<ChartRow[]>([{ t: 0, value: 50 }]);
  const [picked, setPicked] = useState<ChartSelection | null>(null);
  const tick = useRef(0);

  useEffect(() => {
    const id = setInterval(() => {
      setRows((previous) => {
        const last = Number(previous[previous.length - 1]?.value ?? 50);
        tick.current += 1;
        // Paseo aleatorio acotado: sube y baja como una métrica de verdad, sin
        // irse a un número que haga ilegible al resto.
        const next = Math.max(5, Math.min(95, last + (Math.random() - 0.5) * 24));
        return [...previous, { t: tick.current, value: Math.round(next) }];
      });
    }, 350);
    return () => clearInterval(id);
  }, []);

  return (
    <View style={{ gap: 12 }}>
      <Card>
        <Chart
          type="area"
          smooth
          window={60}
          domain="sticky"
          selectBy={(row) => String(row.t)}
          xAxis={false}
          data={rows}
          series={[{ key: 'value', label: 'Requests/s' }]}
          onSelect={setPicked}
          animate={false}
          accessibilityLabel="Requests per second, live"
          testID="chart-live"
        />
      </Card>
      <Body>{picked ? `Held at t${picked.id}: ${picked.value}` : 'Tap a point — it follows its datum as the window slides'}</Body>
    </View>
  );
}

export function ChartDemo() {
  // #region demo
  const variants: VariantDef[] = [
    { label: 'interactive: filter, legend, tooltip', content: <Interactive /> },
    {
      label: 'bar: grouped',
      content: (
        <Card>
          <Chart type="bar" data={MONTHS} series={SERIES} accessibilityLabel="Sales and costs per month" />
        </Card>
      ),
    },
    {
      label: 'bar: stacked',
      content: (
        <Card>
          <Chart type="bar" stacked data={MONTHS} series={SERIES} accessibilityLabel="Sales and costs stacked per month" />
        </Card>
      ),
    },
    {
      label: 'bar: horizontal',
      content: (
        <Card>
          <Chart
            type="bar"
            orientation="horizontal"
            data={SHARE}
            series={[{ key: 'users', label: 'Users' }]}
            accessibilityLabel="Users per platform"
          />
        </Card>
      ),
    },
    {
      label: 'bar: negative values',
      content: (
        <Card>
          <Chart type="bar" data={NET} series={[{ key: 'net', label: 'Net' }]} accessibilityLabel="Net result per quarter" />
        </Card>
      ),
    },
    {
      label: 'line',
      content: (
        <Card>
          <Chart type="line" data={MONTHS} series={SERIES} accessibilityLabel="Sales and costs per month" />
        </Card>
      ),
    },
    {
      label: 'line: smooth',
      content: (
        <Card>
          <Chart type="line" smooth data={MONTHS} series={SERIES} accessibilityLabel="Sales and costs per month, smoothed" />
        </Card>
      ),
    },
    {
      label: 'area',
      content: (
        <Card>
          <Chart type="area" smooth data={MONTHS} series={[{ key: 'sales', label: 'Sales' }]} accessibilityLabel="Sales per month" />
        </Card>
      ),
    },
    {
      label: 'area: stacked',
      content: (
        <Card>
          <Chart type="area" stacked data={MONTHS} series={SERIES} accessibilityLabel="Sales and costs stacked per month" />
        </Card>
      ),
    },
    {
      label: 'pie',
      content: (
        <Card>
          <Chart type="pie" data={SHARE} series={[{ key: 'users' }]} accessibilityLabel="Share of users per platform" />
        </Card>
      ),
    },
    {
      label: 'donut',
      content: (
        <Card>
          <Chart type="donut" data={SHARE} series={[{ key: 'users' }]} sliceLabels="value" accessibilityLabel="Users per platform" />
        </Card>
      ),
    },
    {
      label: 'radar',
      content: (
        <Card>
          <Chart
            type="radar"
            height={260}
            data={SKILLS}
            series={[
              { key: 'mine', label: 'orn-ui' },
              { key: 'theirs', label: 'Other' },
            ]}
            accessibilityLabel="Library comparison"
          />
        </Card>
      ),
    },
    { label: 'live: window, sticky domain, selectBy', content: <LiveChart /> },
    {
      label: 'no data',
      content: (
        <Card>
          <Chart type="bar" data={[]} series={SERIES} emptyText="No sales yet" accessibilityLabel="Sales per month" />
        </Card>
      ),
    },
  ];
  return <VariantList variants={variants} />;
  // #endregion demo
}
