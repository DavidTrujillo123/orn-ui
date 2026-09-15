import React from 'react';
import { View } from 'react-native';
import { Body, Card, ShinyText, useColors } from 'orn-ui';
import { VariantList, type VariantDef } from '@/components/VariantList';

function UpgradeCard() {
  const colors = useColors();

  return (
    <Card>
      <ShinyText text="Pro plan" color={colors.primarySoft} shineColor={colors.primary} />
      <Body style={{ marginTop: 4 }}>Unlimited invoices · priority support</Body>
    </Card>
  );
}

export function ShinyTextDemo() {
  // #region demo
  const variants: VariantDef[] = [
    {
      label: 'default — a band sweeps left to right',
      content: <ShinyText text="Shiny Text" />,
    },
    {
      label: 'align="center" — wraps by word on several lines',
      content: <ShinyText text="A headline long enough to wrap onto more than one line" align="center" />,
    },
    {
      label: 'spread — narrow glint vs. soft wave',
      content: (
        <View style={{ gap: 12 }}>
          <ShinyText text="spread 0.08" spread={0.08} />
          <ShinyText text="spread 0.6" spread={0.6} />
        </View>
      ),
    },
    {
      label: 'duration and delay — slow sweep, long pause',
      content: <ShinyText text="Taking its time" duration={4000} delay={1200} />,
    },
    {
      label: 'animated={false} — plain text, same box',
      content: <ShinyText text="Shiny Text" animated={false} />,
    },
    {
      label: 'colors from the theme',
      content: <UpgradeCard />,
    },
  ];
  return <VariantList variants={variants} />;
  // #endregion demo
}
