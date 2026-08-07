import React, { useState } from 'react';
import { Button, Modal, Body } from 'orn-ui';
import { VariantList, type VariantDef } from '@/components/VariantList';

export function ModalDemo() {
  const [full, setFull] = useState(false);
  const [overlay, setOverlay] = useState(false);
  const [fullScreen, setFullScreen] = useState(false);
  const [bottomSheet, setBottomSheet] = useState(false);
  // #region demo
  const variants: VariantDef[] = [
    {
      label: 'full',
      content: (
        <>
          <Button title="Open full" onPress={() => setFull(true)} />
          <Modal visible={full} onClose={() => setFull(false)} title="Full">
            <Body>Slides up from the bottom and fills the screen.</Body>
          </Modal>
        </>
      ),
    },
    {
      label: 'overlay',
      content: (
        <>
          <Button title="Open overlay" onPress={() => setOverlay(true)} />
          <Modal visible={overlay} onClose={() => setOverlay(false)} title="Overlay" variant="overlay">
            <Body>A centered card over a dimmed backdrop.</Body>
          </Modal>
        </>
      ),
    },
    {
      label: 'fullScreen',
      content: (
        <>
          <Button title="Open fullScreen" onPress={() => setFullScreen(true)} />
          <Modal visible={fullScreen} onClose={() => setFullScreen(false)} title="Full screen" variant="fullScreen">
            <Body>Native fullScreen presentation on iOS.</Body>
          </Modal>
        </>
      ),
    },
    {
      label: 'bottomSheet',
      content: (
        <>
          <Button title="Open bottomSheet" onPress={() => setBottomSheet(true)} />
          <Modal visible={bottomSheet} onClose={() => setBottomSheet(false)} title="Bottom sheet" variant="bottomSheet">
            <Body>Slides up with rounded top corners, like BottomSheet.</Body>
          </Modal>
        </>
      ),
    },
  ];
  return <VariantList variants={variants} />;
  // #endregion demo
}
