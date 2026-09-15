import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Body, Card, Timeline, type TimelineItem } from 'orn-ui';
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

/** Marca hasta `reached` y deja pendiente el resto. */
function upTo(items: TimelineItem[], reached: number): TimelineItem[] {
  return items.map((item, index) => ({ ...item, status: index <= reached ? undefined : 'pending' }));
}

/**
 * Tocar un hito lo alcanza, y con él todo lo anterior: la línea viaja hasta
 * ahí. Tocar el que ya está alcanzado da marcha atrás, para poder mirar la
 * animación en los dos sentidos sin recargar.
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
      {/* El eco existe para el flow de Maestro: el nodo que se llena y la
          línea que viaja son píxeles, y un assert no los ve. El texto sí. */}
      <Body>Reached: {ROADMAP[reached]?.label ?? 'nothing yet'}</Body>
    </View>
  );
}

/**
 * Avanza solo y vuelve a empezar: el demo existe para mirar el movimiento.
 *
 * Sin botón de pausa a propósito. Iba uno, y caía justo donde el pager de
 * VariantList arranca su swipe (80% de la pantalla): el botón se quedaba con
 * el gesto y no se podía pasar de variante.
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
 * Avance estricto: sólo responde el hito que sigue, y lo alcanzado no se
 * devuelve. Es el onboarding que no deja saltear pasos.
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
 * Progreso guardado, contenido revisitable: tocar un hito anterior cambia lo
 * que estoy mirando, no lo que llevo recorrido. La línea se queda donde
 * llegó y el borde marca dónde estoy parado.
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
          // Sólo el hito que sigue empuja el recorrido; los de atrás son una
          // visita.
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
