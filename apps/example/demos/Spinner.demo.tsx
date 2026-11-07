import React from 'react';
import { View } from 'react-native';
import { Spinner, Avatar, Image, useColors } from 'orn-ui';
import { VariantList, type VariantDef } from '@/components/VariantList';

function CustomColorsExample() {
  const colors = useColors();
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, alignItems: 'flex-start' }}>
      <Spinner variant="dots" color={colors.secondary} fullscreen={false} />
      <Spinner variant="ring" color={colors.error} fullscreen={false} />
      <Spinner color={colors.success} fullscreen={false} />
    </View>
  );
}

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
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
          <Spinner variant="dots" size="small" fullscreen={false} />
          <Spinner variant="dots" size="large" fullscreen={false} />
          <Spinner variant="ring" size="small" fullscreen={false} />
          <Spinner variant="ring" size="large" fullscreen={false} />
        </View>
      ),
    },
    {
      label: 'custom color',
      content: <CustomColorsExample />,
    },
    {
      label: 'indicator — bring your own node',
      content: (
        <Spinner
          fullscreen={false}
          text="Uploading..."
          indicator={
            <Avatar size={48} iconName="share" />
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
    {
      label: 'logo — splash / first load',
      content: (
        <Spinner
          variant="dots"
          text="Starting..."
          fullscreen={false}
          logo={
            <Image
              source={{ uri: 'https://reactnative.dev/img/tiny_logo.png' }}
              width={72}
              height={72}
              resizeMode="contain"
              loading={false}
              accessibilityLabel="App logo"
            />
          }
        />
      ),
    },
  ];
  return <VariantList variants={variants} />;
  // #endregion demo
}
