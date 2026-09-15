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
        <Caption>border → text — the widest pair the theme has</Caption>
        <ShinyText text="Maximum contrast" color={colors.border} shineColor={colors.text} />
      </View>
    </View>
  );
}

function Spreads() {
  const colors = useColors();

  return (
    <View style={{ gap: 12 }}>
      <ShinyText text="Narrow glint" spread={0.08} color={colors.border} shineColor={colors.text} />
      <ShinyText text="Soft wide wave" spread={0.6} color={colors.border} shineColor={colors.text} />
    </View>
  );
}

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
  const colors = useColors();
  // El par por defecto sólo cambia luminancia; para mirar *cómo* se mueve la
  // banda conviene el par más separado del tema, que cambia tono también.
  const strong = { color: colors.border, shineColor: colors.text };

  const variants: VariantDef[] = [
    {
      label: 'colors — the resting/shine pair is what makes it readable',
      content: <ColorPairs />,
    },
    {
      label: 'align="center" — wraps by word on several lines',
      content: (
        <ShinyText text="A headline long enough to wrap onto more than one line" align="center" {...strong} />
      ),
    },
    {
      label: 'spread — narrow glint vs. soft wave',
      content: <Spreads />,
    },
    {
      label: 'duration and delay — slow sweep, long pause',
      content: <ShinyText text="Taking its time" duration={4000} delay={1200} {...strong} />,
    },
    {
      label: 'animated={false} — plain text in shineColor, same box',
      content: (
        <VariantRow>
          <ShinyText text="No sweep at all" animated={false} {...strong} />
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
