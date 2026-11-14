import React, { useState } from 'react';
import { Modal, View } from 'react-native';
import { Body, Button, Card, IconButton, Input, Screen, Subtitle, Title } from 'orn-ui';
import { VariantList, type VariantDef } from '@/components/VariantList';

// Screen takes up the whole screen, so each example opens it in a full-screen
// native Modal. In your app, Screen is the root of the route instead.

const BLOCKS = Array.from({ length: 8 }, (_, i) => `Block ${i + 1}`);

function DefaultScreenExample() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button title="Open a screen" onPress={() => setOpen(true)} />
      <Modal visible={open} animationType="slide" onRequestClose={() => setOpen(false)}>
        <Screen>
          <View style={{ padding: 20, gap: 12 }}>
            <Title>Invoices</Title>
            <Body>The title starts below the notch: the top safe area is applied.</Body>
            <Button title="Close" variant="outline" onPress={() => setOpen(false)} />
          </View>
        </Screen>
      </Modal>
    </>
  );
}

function NoInsetsExample() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button title="Open without insets" onPress={() => setOpen(true)} />
      <Modal visible={open} animationType="slide" onRequestClose={() => setOpen(false)}>
        <Screen edges={[]}>
          <View style={{ padding: 20, gap: 12 }}>
            <Title>Invoices</Title>
            <Body>No insets: the content runs under the notch. For full-bleed media.</Body>
            <Button title="Close" variant="outline" onPress={() => setOpen(false)} />
          </View>
        </Screen>
      </Modal>
    </>
  );
}

function HeaderScreenExample() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button title="Open with a header" onPress={() => setOpen(true)} />
      <Modal visible={open} animationType="slide" onRequestClose={() => setOpen(false)}>
        <Screen
          header={
            <View style={{ flexDirection: 'row', alignItems: 'center', padding: 12, gap: 8 }}>
              <IconButton iconName="close" accessibilityLabel="Close" onPress={() => setOpen(false)} />
              <Subtitle>Clients</Subtitle>
            </View>
          }
        >
          <View style={{ padding: 20, gap: 12 }}>
            {BLOCKS.map((block) => (
              <Card key={block}>
                <Body>{block}: the header stays put while this scrolls.</Body>
              </Card>
            ))}
          </View>
        </Screen>
      </Modal>
    </>
  );
}

function FixedScreenExample() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button title="Open a fixed screen" onPress={() => setOpen(true)} />
      <Modal visible={open} animationType="slide" onRequestClose={() => setOpen(false)}>
        <Screen scrollable={false}>
          <View style={{ padding: 20, gap: 12 }}>
            <Button title="Close" variant="outline" onPress={() => setOpen(false)} />
            {BLOCKS.map((block) => (
              <Card key={block}>
                <Body>{block}: without a scroller, what does not fit is cut off.</Body>
              </Card>
            ))}
          </View>
        </Screen>
      </Modal>
    </>
  );
}

function FormScreenExample() {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState('');
  return (
    <>
      <Button title="Open a form" onPress={() => setOpen(true)} />
      <Modal visible={open} animationType="slide" onRequestClose={() => setOpen(false)}>
        <Screen>
          <View style={{ flex: 1, padding: 20, gap: 12, justifyContent: 'space-between' }}>
            <View style={{ gap: 12 }}>
              <Title>New note</Title>
              <Button title="Close" variant="outline" onPress={() => setOpen(false)} />
            </View>
            <Input label="Note" placeholder="Type here" value={note} onChangeText={setNote} />
          </View>
        </Screen>
      </Modal>
    </>
  );
}

export function ScreenDemo() {
  // #region demo
  const variants: VariantDef[] = [
    { label: 'default — safe area top and bottom, scrolls', content: <DefaultScreenExample /> },
    { label: 'edges={[]} — no insets', content: <NoInsetsExample /> },
    { label: 'header — fixed bar, the content scrolls under it', content: <HeaderScreenExample /> },
    { label: 'scrollable={false} — the overflow is clipped', content: <FixedScreenExample /> },
    { label: 'keyboard — a field at the bottom stays above it', content: <FormScreenExample /> },
  ];
  return <VariantList variants={variants} />;
  // #endregion demo
}
