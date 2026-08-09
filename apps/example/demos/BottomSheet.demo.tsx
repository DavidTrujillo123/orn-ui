import React, { useState } from 'react';
import { View } from 'react-native';
import { BottomSheet, Body, Button, FormActions, Input, Title } from 'orn-ui';
import { VariantList, type VariantDef } from '@/components/VariantList';

const LONG = Array.from({ length: 12 }, (_, i) => `Row ${i + 1} — the sheet scrolls when the content does not fit.`);

export function BottomSheetDemo() {
  const [bare, setBare] = useState(false);
  const [form, setForm] = useState(false);
  const [long, setLong] = useState(false);
  const [fixed, setFixed] = useState(false);
  const [hiding, setHiding] = useState(false);
  const [note, setNote] = useState('');

  // #region demo
  const variants: VariantDef[] = [
    {
      label: 'bare — handle only',
      content: (
        <>
          <Button title="Open sheet" onPress={() => setBare(true)} />
          <BottomSheet visible={bare} onClose={() => setBare(false)}>
            <Title style={{ marginBottom: 8 }}>Bottom sheet</Title>
            <Body>Drag the handle down, or tap outside, to dismiss.</Body>
          </BottomSheet>
        </>
      ),
    },
    {
      label: 'title + footer — a form in a sheet',
      content: (
        <>
          <Button title="Open form" onPress={() => setForm(true)} />
          <BottomSheet
            visible={form}
            onClose={() => setForm(false)}
            title="Add a note"
            footer={
              <FormActions
                primaryLabel="Save"
                onPrimaryPress={() => setForm(false)}
                secondaryLabel="Cancel"
                onSecondaryPress={() => setForm(false)}
              />
            }
          >
            <Input label="Note" placeholder="Anything worth remembering" value={note} onChangeText={setNote} />
          </BottomSheet>
        </>
      ),
    },
    {
      label: 'long content — scrolls up to maxHeight',
      content: (
        <>
          <Button title="Open long sheet" onPress={() => setLong(true)} />
          <BottomSheet visible={long} onClose={() => setLong(false)} title="Twelve rows">
            <View style={{ gap: 12 }}>
              {LONG.map((row) => (
                <Body key={row}>{row}</Body>
              ))}
            </View>
          </BottomSheet>
        </>
      ),
    },
    {
      label: 'footerPlacement="hide-with-keyboard" — the form keeps that row',
      content: (
        <>
          <Button title="Open long form" onPress={() => setHiding(true)} />
          <BottomSheet
            visible={hiding}
            onClose={() => setHiding(false)}
            title="Long form"
            footerPlacement="hide-with-keyboard"
            footer={
              <FormActions
                primaryLabel="Save"
                onPrimaryPress={() => setHiding(false)}
                secondaryLabel="Cancel"
                onSecondaryPress={() => setHiding(false)}
              />
            }
          >
            <View style={{ gap: 12 }}>
              {['Name', 'Company', 'Email', 'Phone', 'Address'].map((label) => (
                <Input key={label} label={label} value={note} onChangeText={setNote} />
              ))}
            </View>
          </BottomSheet>
        </>
      ),
    },
    {
      label: 'draggable={false} + maxHeight={0.4}',
      content: (
        <>
          <Button title="Open fixed sheet" onPress={() => setFixed(true)} />
          <BottomSheet
            visible={fixed}
            onClose={() => setFixed(false)}
            title="No dragging"
            draggable={false}
            maxHeight={0.4}
          >
            <Body>Dismiss with the close button or by tapping outside.</Body>
          </BottomSheet>
        </>
      ),
    },
  ];
  return <VariantList variants={variants} />;
  // #endregion demo
}
