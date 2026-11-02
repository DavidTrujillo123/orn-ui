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
 * A real chart: range filter on top, a legend that turns series off and an
 * echo of the selection below. The echo exists for the Maestro flow — the
 * highlighted bar and the bubble are pixels, and an assert can't see them.
 */
function Interactive() {
  const [range, setRange] = useState('6');
  const [picked, setPicked] = useState<ChartSelection | null>(null);
  const rows = useMemo(() => MONTHS.slice(-Number(range)), [range]);

  // Changing the range releases the selection: the selected month may not be
  // in the new slice, and leaving the echo talking about a month no longer visible lies.
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
 * Data that arrives on its own, which is what a WebSocket or SSE does: here
 * the pusher is a `setInterval` because a demo shouldn't depend on a
 * network, but the wiring with Chart is the same — `setRows` and nothing else.
 *
 * The three props that make a live chart readable:
 * - `window`, the sliding window;
 * - `domain="sticky"`, so the axis doesn't rearrange on every tick and make
 *   the line jump even though the data hasn't moved;
 * - `selectBy`, so the selected point follows its datum as the window
 *   slides, instead of staying stuck to an index that now belongs to another.
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
        // Bounded random walk: goes up and down like a real metric, without
        // drifting to a number that makes the rest unreadable.
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
      label: 'line',
      content: (
        <Card>
          <Chart type="line" data={MONTHS} series={SERIES} accessibilityLabel="Sales and costs per month" />
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
      label: 'bar: negative values',
      content: (
        <Card>
          <Chart type="bar" data={NET} series={[{ key: 'net', label: 'Net' }]} accessibilityLabel="Net result per quarter" />
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
