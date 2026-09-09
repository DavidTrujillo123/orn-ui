import React, { useState } from 'react';
import { View } from 'react-native';
import { Slides, Button, Image, Title, Body, Caption, useColors } from 'orn-ui';
import { VariantList, type VariantDef } from '@/components/VariantList';

interface Slide {
  id: string;
  title: string;
  body: string;
  gradient: string[];
}

const SLIDES: Slide[] = [
  { id: '1', title: 'Zero dependencies', body: 'Only react and react-native', gradient: ['#004cef', '#00cae1'] },
  { id: '2', title: 'Light and dark', body: 'Every pair clears WCAG AA', gradient: ['#7b2ff7', '#f107a3'] },
  { id: '3', title: 'Expo SDK 54-57', body: 'Verified on all four', gradient: ['#0f9b0f', '#00cae1'] },
];

const FLAT = ['#101014', '#1d2b3a', '#3a1d2b'];

// Cada botón lleva su propio testID: las tres slides están montadas a la vez,
// así que un selector por texto ("Got it") matchea también las que están fuera
// de pantalla.
function Panel({ slide, onPress }: { slide: Slide; onPress?: () => void }) {
  const colors = useColors();
  return (
    <View style={{ flex: 1, justifyContent: 'center', gap: 8, padding: 24 }}>
      <Title style={{ color: colors.white }}>{slide.title}</Title>
      <Body style={{ color: colors.white }}>{slide.body}</Body>
      {!!onPress && (
        <Button
          title="Got it"
          testID={`slides-button-${slide.id}`}
          variant="secondary"
          onPress={onPress}
          style={{ alignSelf: 'flex-start' }}
        />
      )}
    </View>
  );
}

export function SlidesDemo() {
  const colors = useColors();
  const [tapped, setTapped] = useState<string | null>(null);

  // #region demo
  const variants: VariantDef[] = [
    {
      label: 'horizontal · gradient · dots · infinite + autoPlay',
      content: (
        <Slides
          testID="slides-auto"
          data={SLIDES}
          keyExtractor={(item) => item.id}
          background={(item) => item.gradient}
          renderItem={(item) => <Panel slide={item} />}
          loop
          autoPlay
          interval={2500}
        />
      ),
    },
    {
      // El botón vive acá y no en la variante de "indicadores afuera" a
      // propósito: el flow de Maestro llega a esta página con un solo swipe
      // del pager, y encadenar swipes no es determinista (ver .maestro/README).
      label: 'numbered indicators · flat colors · finite · button inside',
      content: (
        <View style={{ width: '100%', gap: 8 }}>
          <Slides
            testID="slides-numbers"
            data={SLIDES}
            keyExtractor={(item) => item.id}
            background={(_item, index) => FLAT[index] as string}
            renderItem={(item) => <Panel slide={item} onPress={() => setTapped(item.title)} />}
            indicators="numbers"
          />
          <Caption style={{ color: colors.textLight }}>{tapped ? `pressed: ${tapped}` : 'press a button'}</Caption>
        </View>
      ),
    },
    {
      label: 'vertical orientation',
      content: (
        <Slides
          testID="slides-vertical"
          data={SLIDES}
          keyExtractor={(item) => item.id}
          background={(item) => item.gradient}
          gradientDirection="horizontal"
          renderItem={(item) => <Panel slide={item} />}
          orientation="vertical"
          height={280}
        />
      ),
    },
    {
      label: 'indicators outside the slide · diagonal gradient',
      content: (
        <Slides
          testID="slides-outside"
          data={SLIDES}
          keyExtractor={(item) => item.id}
          background={(item) => item.gradient}
          gradientDirection="diagonal"
          renderItem={(item) => <Panel slide={item} />}
          indicatorPlacement="outside"
        />
      ),
    },
    {
      label: 'spacing between slides · gradient background',
      content: (
        <Slides
          testID="slides-spacing"
          data={SLIDES}
          keyExtractor={(item) => item.id}
          background={(item) => item.gradient}
          renderItem={(item) => <Panel slide={item} />}
          spacing={16}
          slideStyle={{ borderRadius: 16 }}
        />
      ),
    },
    {
      label: 'images as slides',
      content: (
        <Slides
          testID="slides-images"
          data={SLIDES}
          keyExtractor={(item) => item.id}
          renderItem={(item) => (
            <Image source={{ uri: `https://picsum.photos/seed/${item.id}/600/400` }} style={{ flex: 1 }} />
          )}
          height={200}
          loop
        />
      ),
    },
  ];
  // #endregion demo

  return <VariantList variants={variants} />;
}
