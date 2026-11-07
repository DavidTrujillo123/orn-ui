import React, { useState } from 'react';
import { View } from 'react-native';
import { Caption, DateField, DatePicker, useTheme, type DateRange } from 'orn-ui';
import { VariantList, type VariantDef } from '@/components/VariantList';

const SPANISH_MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];
const SPANISH_WEEKDAYS = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];

function CalendarExample() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  return <DatePicker value={date} onChange={setDate} />;
}

function RangeExample() {
  const theme = useTheme();
  const [range, setRange] = useState<DateRange | undefined>();
  return (
    <View style={{ gap: theme.tokens.spacing.sm }}>
      <DatePicker mode="range" range={range} onRangeChange={setRange} />
      <Caption>
        {range?.start
          ? `${range.start.toDateString()} → ${range.end ? range.end.toDateString() : '…'}`
          : 'No range selected'}
      </Caption>
    </View>
  );
}

function BoundedRangeExample() {
  const today = new Date();
  const inAMonth = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate());
  const [range, setRange] = useState<DateRange | undefined>();
  return <DatePicker mode="range" range={range} onRangeChange={setRange} minDate={today} maxDate={inAMonth} />;
}

function NextSevenDaysExample() {
  const today = new Date();
  const inAWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7);
  const [date, setDate] = useState<Date | undefined>();
  return <DatePicker value={date} onChange={setDate} minDate={today} maxDate={inAWeek} />;
}

function MondayFirstExample() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  return <DatePicker value={date} onChange={setDate} firstDayOfWeek={1} />;
}

function LocalizedExample() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  return (
    <DatePicker
      value={date}
      onChange={setDate}
      monthNames={SPANISH_MONTHS}
      weekdayNames={SPANISH_WEEKDAYS}
      firstDayOfWeek={1}
    />
  );
}

function DueDateFieldExample() {
  const [dueDate, setDueDate] = useState<Date | undefined>();
  return <DateField label="Due date" value={dueDate} onChange={setDueDate} />;
}

function IsoFormatExample() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  return <DateField label="ISO format" value={date} onChange={setDate} format={(d) => d.toISOString().slice(0, 10)} />;
}

function ClearableFieldExample() {
  const [dueDate, setDueDate] = useState<Date | undefined>(new Date());
  return <DateField label="Due date" value={dueDate} onChange={setDueDate} onClear={() => setDueDate(undefined)} />;
}

function StayFieldExample() {
  const [stay, setStay] = useState<DateRange | undefined>();
  return <DateField label="Stay" mode="range" range={stay} onRangeChange={setStay} />;
}

export function DatePickerDemo() {
  // #region demo
  const variants: VariantDef[] = [
    { label: 'Inline calendar', content: <CalendarExample /> },
    { label: 'mode="range" — tap start, then end', content: <RangeExample /> },
    { label: 'mode="range" + minDate/maxDate', content: <BoundedRangeExample /> },
    { label: 'minDate / maxDate (next 7 days only)', content: <NextSevenDaysExample /> },
    { label: 'Week starts on Monday', content: <MondayFirstExample /> },
    { label: 'Localized month/weekday names', content: <LocalizedExample /> },
    { label: 'DateField — input that opens the calendar', content: <DueDateFieldExample /> },
    { label: 'DateField — custom format', content: <IsoFormatExample /> },
    { label: 'DateField — onClear clears the value', content: <ClearableFieldExample /> },
    { label: 'DateField — mode="range"', content: <StayFieldExample /> },
    {
      label: 'DateField — required + error',
      content: <DateField label="Due date" required onChange={() => {}} error="Pick a date to continue" />,
    },
    { label: 'DateField — disabled', content: <DateField label="Locked" value={new Date()} onChange={() => {}} disabled /> },
  ];
  return <VariantList variants={variants} />;
  // #endregion demo
}
