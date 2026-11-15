import React, { useState } from 'react';
import { View } from 'react-native';
import { Body, TimePicker, type TimeFormat, type TimeValue } from 'orn-ui';
import { VariantList, type VariantDef } from '@/components/VariantList';

function formatTime(value: TimeValue | undefined, hourFormat: TimeFormat) {
  if (!value) return 'No time selected';
  const minute = String(value.minute).padStart(2, '0');
  if (hourFormat === '24h') return `${String(value.hour).padStart(2, '0')}:${minute}`;
  return `${value.hour % 12 || 12}:${minute} ${value.hour < 12 ? 'AM' : 'PM'}`;
}

export function TimePickerDemo() {
  const [value24, setValue24] = useState<TimeValue | undefined>({ hour: 9, minute: 30 });
  const [value12, setValue12] = useState<TimeValue | undefined>({ hour: 14, minute: 15 });
  const [stepped, setStepped] = useState<TimeValue | undefined>({ hour: 10, minute: 0 });
  const [bounded, setBounded] = useState<TimeValue | undefined>({ hour: 9, minute: 0 });
  const [empty, setEmpty] = useState<TimeValue | undefined>();

  // #region demo
  const variants: VariantDef[] = [
    {
      label: '24-hour format (default)',
      content: (
        <View style={{ gap: 12 }}>
          <TimePicker value={value24} onChange={setValue24} testID="time-24" />
          <Body>Selected: {formatTime(value24, '24h')}</Body>
        </View>
      ),
    },
    {
      label: '12-hour format with AM/PM',
      content: (
        <View style={{ gap: 12 }}>
          <TimePicker value={value12} onChange={setValue12} hourFormat="12h" testID="time-12" />
          <Body>Selected: {formatTime(value12, '12h')}</Body>
        </View>
      ),
    },
    {
      label: 'minuteStep={5}',
      content: (
        <View style={{ gap: 12 }}>
          <TimePicker value={stepped} onChange={setStepped} minuteStep={5} testID="time-step" />
          <Body>Selected: {formatTime(stepped, '24h')}</Body>
        </View>
      ),
    },
    {
      label: 'minTime / maxTime (09:00 to 17:00)',
      content: (
        <View style={{ gap: 12 }}>
          <TimePicker
            value={bounded}
            onChange={setBounded}
            minTime={{ hour: 9, minute: 0 }}
            maxTime={{ hour: 17, minute: 0 }}
            minuteStep={15}
            testID="time-bounded"
          />
          <Body>Selected: {formatTime(bounded, '24h')}</Body>
        </View>
      ),
    },
    {
      label: 'empty state: no value until the first wheel move',
      content: (
        <View style={{ gap: 12 }}>
          <TimePicker value={empty} onChange={setEmpty} hourFormat="12h" testID="time-empty" />
          <Body>Selected: {formatTime(empty, '12h')}</Body>
        </View>
      ),
    },
    {
      label: 'disabled',
      content: (
        <View style={{ gap: 12 }}>
          <TimePicker value={{ hour: 18, minute: 45 }} onChange={() => {}} disabled testID="time-disabled" />
          <Body>Selected: {formatTime({ hour: 18, minute: 45 }, '24h')}</Body>
        </View>
      ),
    },
  ];
  return <VariantList variants={variants} />;
  // #endregion demo
}
