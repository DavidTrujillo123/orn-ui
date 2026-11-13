import React, { useState } from 'react';
import { View } from 'react-native';
import { Body, Button, FormActions, Input, Modal } from 'orn-ui';
import { VariantList, type VariantDef } from '@/components/VariantList';

function EditProfileExample() {
  const [visible, setVisible] = useState(false);
  const [name, setName] = useState('Ana Torres');
  return (
    <>
      <Button title="Edit profile" onPress={() => setVisible(true)} />
      <Modal
        visible={visible}
        onClose={() => setVisible(false)}
        title="Edit profile"
        footer={
          <FormActions
            primaryLabel="Save"
            onPrimaryPress={() => setVisible(false)}
            secondaryLabel="Cancel"
            onSecondaryPress={() => setVisible(false)}
          />
        }
      >
        <View style={{ padding: 20 }}>
          <Input label="Name" value={name} onChangeText={setName} />
        </View>
      </Modal>
    </>
  );
}

function OverlayExample() {
  const [visible, setVisible] = useState(false);
  return (
    <>
      <Button title="What's new" onPress={() => setVisible(true)} />
      <Modal variant="overlay" visible={visible} onClose={() => setVisible(false)} title="What's new">
        <Body>Invoices now remember the last payment method. Tap outside or the close button to dismiss.</Body>
      </Modal>
    </>
  );
}

function FullScreenExample() {
  const [visible, setVisible] = useState(false);
  return (
    <>
      <Button title="Open terms" onPress={() => setVisible(true)} />
      <Modal variant="fullScreen" visible={visible} onClose={() => setVisible(false)} title="Terms of service">
        <View style={{ padding: 20 }}>
          <Body>On iOS this uses the native full-screen presentation: the screen behind is not visible.</Body>
        </View>
      </Modal>
    </>
  );
}

export function ModalDemo() {
  // #region demo
  const variants: VariantDef[] = [
    { label: 'full — a page with a fixed footer', content: <EditProfileExample /> },
    { label: 'overlay — a centered card', content: <OverlayExample /> },
    { label: 'fullScreen — native presentation', content: <FullScreenExample /> },
  ];
  return <VariantList variants={variants} />;
  // #endregion demo
}
