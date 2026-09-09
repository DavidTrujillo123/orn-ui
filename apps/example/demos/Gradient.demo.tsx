import React from 'react';
import { View } from 'react-native';
import { Gradient, Button, Body, useColors } from 'orn-ui';
import { VariantList, VariantRow, type VariantDef } from '@/components/VariantList';

const BOX = { height: 120, borderRadius: 12, width: '100%' } as const;
const TILE = { height: 96, width: 96, borderRadius: 12 } as const;

export function GradientDemo() {
  const colors = useColors();

  // #region demo
  const variants: VariantDef[] = [
    {
      label: 'direction: vertical / horizontal',
      content: (
        <View style={{ width: '100%', gap: 12 }}>
          <Gradient colors={['#004cef', '#00cae1']} style={BOX} />
          <Gradient colors={['#004cef', '#00cae1']} direction="horizontal" style={BOX} />
        </View>
      ),
    },
    {
      label: 'direction: diagonal / diagonal-reverse',
      content: (
        <VariantRow>
          <Gradient colors={['#7b2ff7', '#f107a3']} direction="diagonal" style={TILE} />
          <Gradient colors={['#7b2ff7', '#f107a3']} direction="diagonal-reverse" style={TILE} />
        </VariantRow>
      ),
    },
    {
      label: 'several stops — one segment per pair of colors',
      content: <Gradient colors={['#0f9b0f', '#00cae1', '#004cef', '#7b2ff7']} direction="horizontal" style={BOX} />,
    },
    {
      label: 'steps: 3 (visible banding) vs 24 (default)',
      content: (
        <View style={{ width: '100%', gap: 12 }}>
          <Gradient colors={['#101014', '#00cae1']} steps={3} style={BOX} />
          <Gradient colors={['#101014', '#00cae1']} style={BOX} />
        </View>
      ),
    },
    {
      label: 'children stay tappable — the gradient never takes the touch',
      content: (
        <Gradient
          colors={['#004cef', '#00cae1']}
          direction="diagonal"
          style={{ ...BOX, alignItems: 'center', justifyContent: 'center', gap: 8 }}
        >
          <Body style={{ color: colors.white }}>Content sits on top</Body>
          <Button title="Press me" variant="secondary" onPress={() => {}} />
        </Gradient>
      ),
    },
  ];
  // #endregion demo

  return <VariantList variants={variants} />;
}
