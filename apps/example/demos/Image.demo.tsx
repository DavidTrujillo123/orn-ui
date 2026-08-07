import React from 'react';
import { Image, Body } from 'orn-ui';
import { VariantList, VariantRow, type VariantDef } from '@/components/VariantList';

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
        />
      ),
    },
    {
      label: 'Sizes & radius',
      content: (
        <VariantRow>
          <Image source={{ uri: 'https://picsum.photos/200' }} width={48} height={48} radius={24} />
          <Image source={{ uri: 'https://picsum.photos/200' }} width={72} height={72} radius={12} />
          <Image source={{ uri: 'https://picsum.photos/200' }} width={96} height={96} radius={0} />
        </VariantRow>
      ),
    },
    {
      label: 'Custom fallback',
      content: (
        <Image
          source={{ uri: 'https://example.com/broken.png' }}
          width={120}
          height={120}
          radius={12}
          fallback={<Body style={{ textAlign: 'center', padding: 8 }}>Couldn’t load</Body>}
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
