import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Body, Card, Timeline, type TimelineItem } from 'orn-ui';
import { VariantList, type VariantDef } from '@/components/VariantList';

/**
 * The package's real milestones. No numbers inside on purpose: a "544 tests"
 * in a demo starts lying as soon as someone adds a test.
 */
const ROADMAP: TimelineItem[] = [
  { label: 'Zero dependencies', emoji: '📦' },
  { label: 'Expo SDK', emoji: '📱' },
  { label: 'WCAG AA palettes', emoji: '🎨' },
  { label: 'Android runs', emoji: '🤖', status: 'pending' },
  { label: 'v1.0 release', emoji: '🏁', status: 'pending' },
];

/** The path a change goes through before it can be called done. */
const PIPELINE: TimelineItem[] = [
  { label: 'Harness', iconName: 'check' },
  { label: 'Coverage gate', iconName: 'check' },
  { label: 'Maestro flows', iconName: 'info', status: 'pending' },
  { label: 'Publish to npm', iconName: 'info', status: 'pending' },
];

/** Marks up to `reached` and leaves the rest pending. */
function upTo(items: TimelineItem[], reached: number): TimelineItem[] {
  return items.map((item, index) => ({ ...item, status: index <= reached ? undefined : 'pending' }));
}

/**
 * Tapping a milestone reaches it, and everything before it: the line travels
 * there. Tapping the one already reached goes back, so you can watch the
 * animation in both directions without reloading.
 */
function TappableTimeline() {
  const [reached, setReached] = useState(1);

  return (
    <View style={{ gap: 8 }}>
      <Timeline
        items={upTo(ROADMAP, reached)}
        onItemPress={(index) => setReached(index === reached ? index - 1 : index)}
        testID="timeline-tap"
      />
      {/* The echo exists for the Maestro flow: the node filling up and the
          traveling line are pixels, and an assert can't see them. Text it can. */}
      <Body>Reached: {ROADMAP[reached]?.label ?? 'nothing yet'}</Body>
    </View>
  );
}

/**
 * Advances on its own and starts over: the demo exists to watch the motion.
 *
 * No pause button on purpose. There was one, and it landed right where
 * VariantList's pager starts its swipe (80% of the screen): the button kept
 * the gesture and you couldn't move to the next variant.
 */
function AutoTimeline() {
  const [reached, setReached] = useState(-1);

  useEffect(() => {
    const id = setInterval(() => {
      setReached((previous) => (previous >= ROADMAP.length - 1 ? -1 : previous + 1));
    }, 1100);
    return () => clearInterval(id);
  }, []);

  return (
    <View style={{ gap: 8 }}>
      <Timeline items={upTo(ROADMAP, reached)} duration={700} testID="timeline-auto" />
      <Body>Now at: {ROADMAP[reached]?.label ?? 'the start'}</Body>
    </View>
  );
}

/**
 * Strict progression: only the next milestone responds, and what was reached
 * isn't given back. It's the onboarding that doesn't let you skip steps.
 */
function SequentialTimeline() {
  const [reached, setReached] = useState(0);

  return (
    <View style={{ gap: 8 }}>
      <Timeline
        items={upTo(ROADMAP, reached)}
        advance="sequential"
        onItemPress={setReached}
        testID="timeline-seq"
      />
      <Body>
        {reached >= ROADMAP.length - 1
          ? 'All done — nothing left to tap'
          : `Only "${ROADMAP[reached + 1]?.label}" answers`}
      </Body>
    </View>
  );
}

/**
 * Saved progress, revisitable content: tapping an earlier milestone changes
 * what I'm looking at, not how far I've gone. The line stays where it got to
 * and the border marks where I'm standing.
 */
function RevisitTimeline() {
  const [reached, setReached] = useState(2);
  const [looking, setLooking] = useState(2);

  return (
    <View style={{ gap: 8 }}>
      <Timeline
        items={upTo(ROADMAP, reached)}
        advance="revisit"
        selectedIndex={looking}
        onItemPress={(index) => {
          setLooking(index);
          // Only the next milestone pushes the path forward; the ones behind
          // are a visit.
          if (index > reached) setReached(index);
        }}
        testID="timeline-revisit"
      />
      <Body>Looking at: {ROADMAP[looking]?.label}</Body>
      <Body>Progress stays at: {ROADMAP[reached]?.label}</Body>
    </View>
  );
}

export function TimelineDemo() {
  // #region demo
  const variants: VariantDef[] = [
    {
      label: 'default — the line bows, the pills alternate sides',
      content: <Timeline items={ROADMAP} testID="timeline-roadmap" />,
    },
    {
      label: 'onItemPress — tap a milestone and the line travels there',
      content: <TappableTimeline />,
    },
    {
      label: 'advance="sequential" — only the next milestone answers, no going back',
      content: <SequentialTimeline />,
    },
    {
      label: 'advance="revisit" — revisit the past, keep the progress',
      content: <RevisitTimeline />,
    },
    {
      label: 'advancing on its own — the line draws itself, gap by gap',
      content: <AutoTimeline />,
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
