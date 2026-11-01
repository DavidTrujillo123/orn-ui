import React from 'react';
import { View } from 'react-native';
import { Body, Caption, Card, ShinyText, useColors } from 'orn-ui';
import { VariantList, VariantRow, type VariantDef } from '@/components/VariantList';

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
  // Los colores de reposo siempre legibles (AA): el brillo es decorativo, el
  // texto tiene que leerse también cuando la banda no está encima.
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
        <VariantRow>
          <ShinyText text="No sweep at all" animated={false} />
        </VariantRow>
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
