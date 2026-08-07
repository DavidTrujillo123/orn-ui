import React from 'react';
import { View } from 'react-native';
import { Spinner, Avatar, Icon } from 'orn-ui';
import { VariantList, VariantRow, type VariantDef } from '@/components/VariantList';

export function SpinnerDemo() {
  // #region demo
  const variants: VariantDef[] = [
    {
      label: 'variant="native" (default — system ActivityIndicator)',
      content: <Spinner text="Loading..." fullscreen={false} />,
    },
    {
      label: 'variant="dots" — custom, identical on iOS and Android',
      content: <Spinner variant="dots" text="Fetching invoices..." fullscreen={false} />,
    },
    {
      label: 'variant="ring" — custom spinning ring',
      content: <Spinner variant="ring" text="Syncing..." fullscreen={false} />,
    },
    {
      label: 'sizes',
      content: (
        <VariantRow>
          <Spinner variant="dots" size="small" fullscreen={false} />
          <Spinner variant="dots" size="large" fullscreen={false} />
          <Spinner variant="ring" size="small" fullscreen={false} />
          <Spinner variant="ring" size="large" fullscreen={false} />
        </VariantRow>
      ),
    },
    {
      label: 'custom color',
      content: (
        <VariantRow>
          <Spinner variant="dots" color="#00cae1" fullscreen={false} />
          <Spinner variant="ring" color="#ff3b30" fullscreen={false} />
          <Spinner color="#34c759" fullscreen={false} />
        </VariantRow>
      ),
    },
    {
      label: 'indicator — bring your own node',
      content: (
        <Spinner
          fullscreen={false}
          text="Uploading..."
          indicator={
            <Avatar size={48} backgroundColor="#004cef20">
              <Icon name="plus" size={24} color="#004cef" />
            </Avatar>
          }
        />
      ),
    },
    {
      label: 'no text',
      content: (
        <View style={{ alignItems: 'center' }}>
          <Spinner variant="ring" fullscreen={false} />
        </View>
      ),
    },
  ];
  return <VariantList variants={variants} />;
  // #endregion demo
}
