import React, { useState } from 'react';
import { Modal as RNModal, StyleSheet, View } from 'react-native';
import { Body, Button, Caption, Card, Input, Screen, Subtitle, Title, useColors, useInsets } from 'orn-ui';
import type { ScreenProps } from 'orn-ui';
import { VariantList, type VariantDef } from '@/components/VariantList';

/**
 * Screen ocupa la pantalla entera: dentro de una tarjeta de 120pt no se ve nada
 * de lo que hace. Cada variante abre una pantalla real y pinta encima las
 * franjas de safe area, que es lo único que hace visible el efecto de `edges`.
 */
function InsetGuides() {
  const insets = useInsets();
  const colors = useColors();
  const band = { position: 'absolute' as const, left: 0, right: 0, backgroundColor: `${colors.error}26` };

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={[band, { top: 0, height: insets.top }]} />
      <View style={[band, { bottom: 0, height: insets.bottom }]} />
    </View>
  );
}

function FullScreenDemo({
  trigger,
  explanation,
  showGuides = true,
  longContent = false,
  withInput = false,
  ...screenProps
}: Omit<ScreenProps, 'children'> & {
  trigger: string;
  explanation: string;
  showGuides?: boolean;
  longContent?: boolean;
  withInput?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState('');

  return (
    <>
      <Button title={trigger} onPress={() => setOpen(true)} />

      <RNModal visible={open} animationType="slide" onRequestClose={() => setOpen(false)}>
        <View style={{ flex: 1 }}>
          <Screen {...screenProps}>
            <View style={{ paddingHorizontal: 20, gap: 12 }}>
              <Title>Screen</Title>
              <Caption>{explanation}</Caption>
              <Button title="Close" variant="outline" onPress={() => setOpen(false)} />

              {longContent &&
                Array.from({ length: 8 }, (_, i) => (
                  <Card key={i}>
                    <Subtitle>Block {i + 1}</Subtitle>
                    <Body style={{ marginTop: 4 }}>
                      Eight of these do not fit on one screen — that is the point.
                    </Body>
                  </Card>
                ))}

              {withInput && (
                <Card>
                  <Body style={{ marginBottom: 12 }}>
                    The field sits at the bottom. Focus it: it should stay above the keyboard.
                  </Body>
                  <Input label="Note" placeholder="Type here" value={note} onChangeText={setNote} />
                </Card>
              )}
            </View>
          </Screen>

          {showGuides && <InsetGuides />}
        </View>
      </RNModal>
    </>
  );
}

export function ScreenDemo() {
  // #region demo
  const variants: VariantDef[] = [
    {
      label: 'edges={["top","bottom"]} (default) — content clears the notch',
      content: (
        <FullScreenDemo
          trigger="Open with safe area"
          explanation="The red bands are the safe-area insets. The title starts below the top one."
        />
      ),
    },
    {
      label: 'edges={[]} — the same screen without insets',
      content: (
        <FullScreenDemo
          trigger="Open without safe area"
          edges={[]}
          explanation="Same content, no insets: the title now runs under the notch band."
        />
      ),
    },
    {
      label: 'scrollable (default) — long content scrolls',
      content: (
        <FullScreenDemo
          trigger="Open a long screen"
          longContent
          explanation="Eight blocks inside the default scroller: scroll to the end and back."
        />
      ),
    },
    {
      label: 'scrollable={false} — the overflow is clipped',
      content: (
        <FullScreenDemo
          trigger="Open a fixed screen"
          scrollable={false}
          longContent
          explanation="Same eight blocks with no scroller: everything past the fold is unreachable."
        />
      ),
    },
    {
      label: 'keyboard — the focused field stays visible',
      content: (
        <FullScreenDemo
          trigger="Open a form screen"
          longContent
          withInput
          showGuides={false}
          explanation="Scroll to the field at the bottom and focus it."
        />
      ),
    },
  ];
  return <VariantList variants={variants} />;
  // #endregion demo
}
