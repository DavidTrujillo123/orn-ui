import React from 'react';
import { View } from 'react-native';
import { Body, Card, Skeleton, useTheme } from 'orn-ui';
import { VariantList, type VariantDef } from '@/components/VariantList';

// Same layout as the loaded card (avatar, two lines, badge), so the content
// lands in place without a jump.
function LoadingCardExample() {
  const theme = useTheme();
  return (
    <Card>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.tokens.spacing.md }}>
        <Skeleton variant="circle" width={48} />
        <View style={{ flex: 1, gap: theme.tokens.spacing.sm }}>
          <Skeleton width="70%" height={14} />
          <Skeleton width="45%" height={12} />
        </View>
        <Skeleton width={56} height={22} radius={11} />
      </View>
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
      label: 'variant="text" — 3 lines, same height as the Body below',
      content: (
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Skeleton variant="text" lines={3} />
          </View>
          <View style={{ flex: 1 }}>
            <Body numberOfLines={3}>
              Each bar takes one Body line, so the text lands without a jump.
            </Body>
          </View>
        </View>
      ),
    },
    {
      label: 'variant="circle" — avatars',
      content: (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, alignItems: 'flex-start' }}>
          <Skeleton variant="circle" width={32} />
          <Skeleton variant="circle" width={48} />
          <Skeleton variant="circle" width={64} />
        </View>
      ),
    },
    {
      label: 'animated={false} — no pulse',
      content: <Skeleton height={20} animated={false} />,
    },
    {
      label: 'compose a card placeholder',
      content: <LoadingCardExample />,
    },
  ];
  return <VariantList variants={variants} />;
  // #endregion demo
}
