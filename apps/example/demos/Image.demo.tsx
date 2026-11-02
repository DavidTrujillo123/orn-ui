import React from 'react';
import { View } from 'react-native';
import { Image, Body } from 'orn-ui';
import { VariantList, type VariantDef } from '@/components/VariantList';

export function ImageDemo() {
  // #region demo
  const variants: VariantDef[] = [
    {
      label: 'Basic',
      content: (
        <Image
          source={{ uri: 'https://picsum.photos/200' }}
          width={120}
          height={120}
          radius={12}
          accessibilityLabel="Random landscape photo"
        />
      ),
    },
    {
      label: 'Sizes & radius',
      content: (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, alignItems: 'flex-start' }}>
          <Image source={{ uri: 'https://picsum.photos/200' }} width={48} height={48} radius={24} />
          <Image source={{ uri: 'https://picsum.photos/200' }} width={72} height={72} radius={12} />
          <Image source={{ uri: 'https://picsum.photos/200' }} width={96} height={96} radius={0} />
        </View>
      ),
    },
    {
      label: 'Broken URL: default fallback',
      content: <Image source={{ uri: 'https://example.com/broken.png' }} width={120} height={120} radius={12} />,
    },
    {
      label: 'Custom fallback',
      content: (
        <Image
          source={{ uri: 'https://example.com/broken.png' }}
          width={120}
          height={120}
          radius={12}
          fallback={<Body align="center">Couldn’t load</Body>}
        />
      ),
    },
    {
      label: 'Above-the-fold (priority="high")',
      content: (
        <Image
          source={{ uri: 'https://picsum.photos/400' }}
          width={160}
          height={90}
          radius={8}
          priority="high"
        />
      ),
    },
  ];
  return <VariantList variants={variants} />;
  // #endregion demo
}
