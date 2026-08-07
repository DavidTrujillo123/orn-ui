import React, { useState } from 'react';
import { DatePicker, DateField, Caption, type DateRange } from 'orn-ui';
import { VariantList, type VariantDef } from '@/components/VariantList';
import { View } from 'react-native';

const SPANISH_MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];
const SPANISH_WEEKDAYS = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];

const today = new Date();
const inAWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7);
const inAMonth = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate());

export function DatePickerDemo() {
  const [date, setDate] = useState<Date | undefined>(today);
  const [ranged, setRanged] = useState<Date | undefined>();
  const [fieldDate, setFieldDate] = useState<Date | undefined>();
  const [range, setRange] = useState<DateRange | undefined>();
  // #region demo
  const variants: VariantDef[] = [
    {
      label: 'Inline calendar',
      content: <DatePicker value={date} onChange={setDate} />,
    },
    {
      label: 'mode="range" — tap start, then end',
      content: (
        <View style={{ gap: 8 }}>
          <DatePicker mode="range" range={range} onRangeChange={setRange} />
          <Caption>
            {range?.start
              ? `${range.start.toDateString()} → ${range.end ? range.end.toDateString() : '…'}`
              : 'No range selected'}
          </Caption>
        </View>
      ),
    },
    {
      label: 'mode="range" + minDate/maxDate',
      content: <DatePicker mode="range" range={range} onRangeChange={setRange} minDate={today} maxDate={inAMonth} />,
    },
    {
      label: 'minDate / maxDate (next 7 days only)',
      content: <DatePicker value={ranged} onChange={setRanged} minDate={today} maxDate={inAWeek} />,
    },
    {
      label: 'Week starts on Monday',
      content: <DatePicker value={date} onChange={setDate} firstDayOfWeek={1} />,
    },
    {
      label: 'Localized month/weekday names',
      content: (
        <DatePicker
          value={date}
          onChange={setDate}
          monthNames={SPANISH_MONTHS}
          weekdayNames={SPANISH_WEEKDAYS}
          firstDayOfWeek={1}
        />
      ),
    },
    {
      label: 'DateField — input that opens the calendar',
      content: <DateField label="Due date" value={fieldDate} onChange={setFieldDate} maxDate={inAMonth} />,
    },
    {
      label: 'DateField — custom format',
      content: (
        <DateField
          label="ISO format"
          value={fieldDate}
          onChange={setFieldDate}
          format={(d) => d.toISOString().slice(0, 10)}
        />
      ),
    },
    {
      label: 'DateField — required + error',
      content: <DateField label="Due date" required onChange={() => {}} error="Pick a date to continue" />,
    },
    {
      label: 'DateField — disabled',
      content: <DateField label="Locked" value={today} onChange={() => {}} disabled />,
    },
  ];
  return <VariantList variants={variants} />;
  // #endregion demo
}
