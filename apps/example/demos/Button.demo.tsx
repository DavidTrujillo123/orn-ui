import React, { useState } from 'react';
import { View } from 'react-native';
import { Button } from 'orn-ui';
import { VariantList, type VariantDef } from '@/components/VariantList';

export function ButtonDemo() {
  const [loading, setLoading] = useState(false);
  // #region demo
  const variants: VariantDef[] = [
    { label: 'Primary', content: <Button title="Primary" onPress={() => {}} /> },
    { label: 'Secondary', content: <Button title="Secondary" variant="secondary" onPress={() => {}} /> },
    { label: 'Outline', content: <Button title="Outline" variant="outline" onPress={() => {}} /> },
    { label: 'Ghost', content: <Button title="Ghost" variant="ghost" onPress={() => {}} /> },
    { label: 'Link', content: <Button title="Link" variant="link" onPress={() => {}} /> },
    { label: 'Destructive', content: <Button title="Destructive" variant="destructive" onPress={() => {}} /> },
    {
      label: 'Sizes',
      content: (
        <View style={{ gap: 8 }}>
          <Button title="Small" size="sm" onPress={() => {}} />
          <Button title="Medium (default)" size="md" onPress={() => {}} />
          <Button title="Large" size="lg" onPress={() => {}} />
        </View>
      ),
    },
    { label: 'Disabled', content: <Button title="Disabled" disabled onPress={() => {}} /> },
    {
      label: 'Loading',
      content: (
        <Button
          title="Tap to load"
          loading={loading}
          onPress={() => {
            setLoading(true);
            setTimeout(() => setLoading(false), 1500);
          }}
        />
      ),
    },
    { label: 'Left icon', content: <Button title="Confirm" leftIconName="check" onPress={() => {}} /> },
    { label: 'Right icon', content: <Button title="Next" rightIconName="chevron-right" onPress={() => {}} /> },
  ];
  return <VariantList variants={variants} />;
  // #endregion demo
}
