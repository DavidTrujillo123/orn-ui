import React from 'react';
import { View } from 'react-native';
import { Card, Timeline, type TimelineItem } from 'orn-ui';
import { VariantList, type VariantDef } from '@/components/VariantList';

const ROADMAP: TimelineItem[] = [
  { label: 'Award-level design', emoji: '✨' },
  { label: 'Strictly typed', emoji: '🛡️' },
  { label: '60fps motion', emoji: '⚡' },
  { label: 'AI-agent ready', emoji: '🤖', status: 'pending' },
  { label: 'One-command install', emoji: '📦', status: 'pending' },
];

const RELEASES: TimelineItem[] = [
  { label: 'Ordered', iconName: 'check' },
  { label: 'Packed', iconName: 'check' },
  { label: 'In transit', iconName: 'info', status: 'pending' },
  { label: 'Delivered', iconName: 'info', status: 'pending' },
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
      content: <Timeline items={RELEASES} curve={0} testID="timeline-straight" />,
    },
    {
      label: 'startSide="left" and a wider curve',
      content: <Timeline items={RELEASES} startSide="left" curve={44} testID="timeline-left" />,
    },
    {
      label: 'glow={false} — just the pills',
      content: <Timeline items={ROADMAP} glow={false} testID="timeline-flat" />,
    },
    {
      label: 'spacing={60} — tighter, inside a Card',
      content: (
        <Card>
          <Timeline items={RELEASES} spacing={60} curve={20} testID="timeline-card" />
        </Card>
      ),
    },
    {
      label: 'a single item — no line to draw',
      content: (
        <View>
          <Timeline items={[{ label: 'Only milestone', emoji: '🏁' }]} testID="timeline-one" />
        </View>
      ),
    },
  ];
  return <VariantList variants={variants} />;
  // #endregion demo
}
