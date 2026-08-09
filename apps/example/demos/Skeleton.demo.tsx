import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Badge, Body, Card, Skeleton, Subtitle } from 'orn-ui';
import { VariantList, VariantRow, type VariantDef } from '@/components/VariantList';

function LoadingCard() {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setLoaded((v) => !v), 2000);
    return () => clearInterval(id);
  }, []);

  return (
    <Card>
      {loaded ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#004cef20' }} />
          <View style={{ flex: 1, gap: 4 }}>
            <Subtitle>Acme Studio</Subtitle>
            <Body>Invoice #1042 · paid</Body>
          </View>
          <Badge label="PAID" variant="success" />
        </View>
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Skeleton variant="circle" width={48} />
          <View style={{ flex: 1, gap: 8 }}>
            <Skeleton width="70%" height={14} />
            <Skeleton width="45%" height={12} />
          </View>
          <Skeleton width={56} height={22} radius={11} />
        </View>
      )}
    </Card>
  );
}

export function SkeletonDemo() {
  // #region demo
  const variants: VariantDef[] = [
    {
      label: 'rect (default)',
      content: <Skeleton height={20} />,
    },
    {
      label: 'variant="text" — párrafo de 3 líneas',
      content: <Skeleton variant="text" lines={3} />,
    },
    {
      label: 'variant="circle" — avatares',
      content: (
        <VariantRow>
          <Skeleton variant="circle" width={32} />
          <Skeleton variant="circle" width={48} />
          <Skeleton variant="circle" width={64} />
        </VariantRow>
      ),
    },
    {
      label: 'animated={false} — sin pulso',
      content: <Skeleton height={20} animated={false} />,
    },
    {
      label: 'reserva el espacio exacto: alterna cada 2s',
      content: <LoadingCard />,
    },
  ];
  return <VariantList variants={variants} />;
  // #endregion demo
}
