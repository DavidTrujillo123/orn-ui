import React, { useState } from 'react';
import { View } from 'react-native';
import { Body, TimePicker, type TimeValue } from 'orn-ui';
import { VariantList, type VariantDef } from '@/components/VariantList';

function TwentyFourHourExample() {
  const [value, setValue] = useState<TimeValue | undefined>({ hour: 9, minute: 30 });
  const selected = value
    ? `${String(value.hour).padStart(2, '0')}:${String(value.minute).padStart(2, '0')}`
    : 'No time selected';

  return (
    <View style={{ gap: 12 }}>
      <TimePicker value={value} onChange={setValue} testID="time-24" />
      <Body>Selected: {selected}</Body>
    </View>
  );
}

function TwelveHourExample() {
  const [value, setValue] = useState<TimeValue | undefined>({ hour: 14, minute: 15 });
  const selected = value
    ? `${value.hour % 12 || 12}:${String(value.minute).padStart(2, '0')} ${value.hour < 12 ? 'AM' : 'PM'}`
    : 'No time selected';

  return (
    <View style={{ gap: 12 }}>
      <TimePicker value={value} onChange={setValue} hourFormat="12h" testID="time-12" />
      <Body>Selected: {selected}</Body>
    </View>
  );
}

function MinuteStepExample() {
  const [value, setValue] = useState<TimeValue | undefined>({ hour: 10, minute: 0 });
  const selected = value
    ? `${String(value.hour).padStart(2, '0')}:${String(value.minute).padStart(2, '0')}`
    : 'No time selected';

  return (
    <View style={{ gap: 12 }}>
      <TimePicker value={value} onChange={setValue} minuteStep={5} testID="time-step" />
      <Body>Selected: {selected}</Body>
    </View>
  );
}

function BoundsExample() {
  const [value, setValue] = useState<TimeValue | undefined>({ hour: 9, minute: 0 });
  const selected = value
    ? `${String(value.hour).padStart(2, '0')}:${String(value.minute).padStart(2, '0')}`
    : 'No time selected';

  return (
    <View style={{ gap: 12 }}>
      <TimePicker
        value={value}
        onChange={setValue}
        minTime={{ hour: 9, minute: 0 }}
        maxTime={{ hour: 17, minute: 0 }}
        minuteStep={15}
        testID="time-bounded"
      />
      <Body>Selected: {selected}</Body>
    </View>
  );
}

function EmptyExample() {
  const [value, setValue] = useState<TimeValue | undefined>();
  const selected = value
    ? `${value.hour % 12 || 12}:${String(value.minute).padStart(2, '0')} ${value.hour < 12 ? 'AM' : 'PM'}`
    : 'No time selected';

  return (
    <View style={{ gap: 12 }}>
      <TimePicker value={value} onChange={setValue} hourFormat="12h" testID="time-empty" />
      <Body>Selected: {selected}</Body>
    </View>
  );
}

export function TimePickerDemo() {
  // #region demo
  const variants: VariantDef[] = [
    {
      label: '24-hour format (default)',
      content: <TwentyFourHourExample />,
    },
    {
      label: '12-hour format with AM/PM',
      content: <TwelveHourExample />,
    },
    {
      label: 'minuteStep={5}',
      content: <MinuteStepExample />,
    },
    {
      label: 'minTime / maxTime (09:00 to 17:00)',
      content: <BoundsExample />,
    },
    {
      label: 'empty state: no value until the first wheel move',
      content: <EmptyExample />,
    },
    {
      label: 'disabled',
      content: (
        <View style={{ gap: 12 }}>
          <TimePicker value={{ hour: 18, minute: 45 }} onChange={() => {}} disabled testID="time-disabled" />
          <Body>Selected: 18:45</Body>
        </View>
      ),
    },
  ];
  return <VariantList variants={variants} />;
  // #endregion demo
}
