import React from 'react';
import { View } from 'react-native';
import { Card, Timeline, type TimelineItem } from 'orn-ui';
import { VariantList, type VariantDef } from '@/components/VariantList';

/**
 * Hitos reales del paquete. Sin números adentro a propósito: un "544 tests" en
 * un demo queda mintiendo en cuanto alguien agrega un test.
 */
const ROADMAP: TimelineItem[] = [
  { label: 'Zero dependencies', emoji: '📦' },
  { label: 'Expo SDK 54–57', emoji: '📱' },
  { label: 'WCAG AA palettes', emoji: '🎨' },
  { label: 'Android device runs', emoji: '🤖', status: 'pending' },
  { label: 'v1.0 release', emoji: '🏁', status: 'pending' },
];

/** El camino que recorre un cambio antes de poder decirse terminado. */
const PIPELINE: TimelineItem[] = [
  { label: 'Harness', iconName: 'check' },
  { label: 'Coverage gate', iconName: 'check' },
  { label: 'Maestro flows', iconName: 'info', status: 'pending' },
  { label: 'Publish to npm', iconName: 'info', status: 'pending' },
];

export function TimelineDemo() {
  // #region demo
  const variants: VariantDef[] = [
    {
      label: 'default — the line bows, the pills alternate sides',
      content: <Timeline items={ROADMAP} testID="timeline-roadmap" />,
    },
    {
      label: 'curve={0} — a straight spine',
      content: <Timeline items={PIPELINE} curve={0} testID="timeline-straight" />,
    },
    {
      label: 'startSide="left" and a wider curve',
      content: <Timeline items={PIPELINE} startSide="left" curve={44} testID="timeline-left" />,
    },
    {
      label: 'glow={false} — just the pills',
      content: <Timeline items={ROADMAP} glow={false} testID="timeline-flat" />,
    },
    {
      label: 'spacing={60} — tighter, inside a Card',
      content: (
        <Card>
          <Timeline items={PIPELINE} spacing={60} curve={20} testID="timeline-card" />
        </Card>
      ),
    },
    {
      label: 'a single item — no line to draw',
      content: (
        <View>
          <Timeline items={[{ label: 'Atomic design', emoji: '⚛️' }]} testID="timeline-one" />
        </View>
      ),
    },
  ];
  return <VariantList variants={variants} />;
  // #endregion demo
}
