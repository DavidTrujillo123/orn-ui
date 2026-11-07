import React, { useState } from 'react';
import { Button, Modal, Body } from 'orn-ui';
import { VariantList, type VariantDef } from '@/components/VariantList';

function FullModalExample() {
  const [visible, setVisible] = useState(false);
  return (
    <>
      <Button title="Open full" onPress={() => setVisible(true)} />
      <Modal visible={visible} onClose={() => setVisible(false)} title="Full">
        <Body>Slides up from the bottom and fills the screen.</Body>
      </Modal>
    </>
  );
}

function OverlayModalExample() {
  const [visible, setVisible] = useState(false);
  return (
    <>
      <Button title="Open overlay" onPress={() => setVisible(true)} />
      <Modal visible={visible} onClose={() => setVisible(false)} title="Overlay" variant="overlay">
        <Body>A centered card over a dimmed backdrop.</Body>
      </Modal>
    </>
  );
}

function FullScreenModalExample() {
  const [visible, setVisible] = useState(false);
  return (
    <>
      <Button title="Open fullScreen" onPress={() => setVisible(true)} />
      <Modal visible={visible} onClose={() => setVisible(false)} title="Full screen" variant="fullScreen">
        <Body>Native fullScreen presentation on iOS.</Body>
      </Modal>
    </>
  );
}

export function ModalDemo() {
  // #region demo
  const variants: VariantDef[] = [
    { label: 'full', content: <FullModalExample /> },
    { label: 'overlay', content: <OverlayModalExample /> },
    { label: 'fullScreen', content: <FullScreenModalExample /> },
  ];
  return <VariantList variants={variants} />;
  // #endregion demo
}
