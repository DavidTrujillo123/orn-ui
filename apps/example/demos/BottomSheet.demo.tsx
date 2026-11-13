import React, { useState } from 'react';
import { View } from 'react-native';
import { BottomSheet, Body, Button, FormActions, Input, useTheme } from 'orn-ui';
import { VariantList, type VariantDef } from '@/components/VariantList';

function BareSheetExample() {
  const [visible, setVisible] = useState(false);
  return (
    <>
      <Button title="Open sheet" onPress={() => setVisible(true)} />
      <BottomSheet visible={visible} onClose={() => setVisible(false)}>
        <Body>Drag the handle down, or tap outside, to dismiss.</Body>
      </BottomSheet>
    </>
  );
}

function FormSheetExample() {
  const [visible, setVisible] = useState(false);
  const [note, setNote] = useState('');
  return (
    <>
      <Button title="Add a note" onPress={() => setVisible(true)} />
      <BottomSheet
        visible={visible}
        onClose={() => setVisible(false)}
        title="Add a note"
        footer={
          <FormActions
            primaryLabel="Save"
            onPrimaryPress={() => setVisible(false)}
            secondaryLabel="Cancel"
            onSecondaryPress={() => setVisible(false)}
          />
        }
      >
        <Input label="Note" placeholder="Anything worth remembering" value={note} onChangeText={setNote} />
      </BottomSheet>
    </>
  );
}

function LongSheetExample() {
  const theme = useTheme();
  const [visible, setVisible] = useState(false);
  return (
    <>
      <Button title="Open long sheet" onPress={() => setVisible(true)} />
      <BottomSheet visible={visible} onClose={() => setVisible(false)} title="Twelve rows" maxHeight={0.8}>
        <View style={{ gap: theme.tokens.spacing.md }}>
          {Array.from({ length: 12 }, (_, i) => (
            <Body key={i}>Row {i + 1} — the sheet scrolls when the content does not fit.</Body>
          ))}
        </View>
      </BottomSheet>
    </>
  );
}

function HideWithKeyboardExample() {
  const theme = useTheme();
  const [visible, setVisible] = useState(false);
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  return (
    <>
      <Button title="Open long form" onPress={() => setVisible(true)} />
      <BottomSheet
        visible={visible}
        onClose={() => setVisible(false)}
        title="Long form"
        footerPlacement="hide-with-keyboard"
        footer={
          <FormActions
            primaryLabel="Save"
            onPrimaryPress={() => setVisible(false)}
            secondaryLabel="Cancel"
            onSecondaryPress={() => setVisible(false)}
          />
        }
      >
        <View style={{ gap: theme.tokens.spacing.md }}>
          <Input label="Name" value={name} onChangeText={setName} />
          <Input label="Company" value={company} onChangeText={setCompany} />
          <Input label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" />
        </View>
      </BottomSheet>
    </>
  );
}

function FixedSheetExample() {
  const [visible, setVisible] = useState(false);
  return (
    <>
      <Button title="Open fixed sheet" onPress={() => setVisible(true)} />
      <BottomSheet
        visible={visible}
        onClose={() => setVisible(false)}
        title="No dragging"
        draggable={false}
        maxHeight={0.4}
      >
        <Body>Dismiss with the close button or by tapping outside.</Body>
      </BottomSheet>
    </>
  );
}

export function BottomSheetDemo() {
  // #region demo
  const variants: VariantDef[] = [
    { label: 'bare — handle only', content: <BareSheetExample /> },
    { label: 'title + footer — a form in a sheet', content: <FormSheetExample /> },
    { label: 'long content — scrolls up to maxHeight', content: <LongSheetExample /> },
    { label: 'footerPlacement="hide-with-keyboard"', content: <HideWithKeyboardExample /> },
    { label: 'draggable={false} + maxHeight={0.4}', content: <FixedSheetExample /> },
  ];
  return <VariantList variants={variants} />;
  // #endregion demo
}
