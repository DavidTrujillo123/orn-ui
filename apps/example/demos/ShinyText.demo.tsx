import React from 'react';
import { View } from 'react-native';
import { Body, Caption, Card, ShinyText, useColors } from 'orn-ui';
import { VariantList, type VariantDef } from '@/components/VariantList';

function ColorPairs() {
  const colors = useColors();

  return (
    <View style={{ gap: 16 }}>
      <View style={{ gap: 4 }}>
        <Caption>default — textLight resting, primary shining</Caption>
        <ShinyText text="Default pair" />
      </View>
      <View style={{ gap: 4 }}>
        <Caption>text → primary — both colors stay readable at rest</Caption>
        <ShinyText text="Custom pair" color={colors.text} shineColor={colors.primary} />
      </View>
    </View>
  );
}

function Spreads() {
  return (
    <View style={{ gap: 12 }}>
      <ShinyText text="Narrow glint" spread={0.08} />
      <ShinyText text="Soft wide wave" spread={0.6} />
    </View>
  );
}

function UpgradeCard() {
  const colors = useColors();

  return (
    <Card>
      <ShinyText text="Pro plan" color={colors.text} shineColor={colors.primary} />
      <Body style={{ marginTop: 4 }}>Unlimited invoices · priority support</Body>
    </Card>
  );
}

export function ShinyTextDemo() {
  // #region demo
  // The resting colors are always legible (AA): the shine is decorative, the
  // text has to read also when the band isn't over it.
  const variants: VariantDef[] = [
    {
      label: 'colors — the resting/shine pair is what makes it readable',
      content: <ColorPairs />,
    },
    {
      label: 'align="center" — wraps by word on several lines',
      content: (
        <ShinyText text="A headline long enough to wrap onto more than one line" align="center" />
      ),
    },
    {
      label: 'spread — narrow glint vs. soft wave',
      content: <Spreads />,
    },
    {
      label: 'duration and delay — slow sweep, long pause',
      content: <ShinyText text="Taking its time" duration={4000} delay={1200} />,
    },
    {
      label: 'animated={false} — plain text in shineColor, same box',
      content: (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, alignItems: 'flex-start' }}>
          <ShinyText text="No sweep at all" animated={false} />
        </View>
      ),
    },
    {
      label: 'in a card, with the brand accent',
      content: <UpgradeCard />,
    },
  ];
  return <VariantList variants={variants} />;
  // #endregion demo
}
