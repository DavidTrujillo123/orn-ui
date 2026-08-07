import React, { useState } from 'react';
import { Button, BottomSheet, Body, Title } from 'orn-ui';
import { VariantList, type VariantDef } from '@/components/VariantList';

export function BottomSheetDemo() {
  const [visible, setVisible] = useState(false);
  // #region demo
  const variants: VariantDef[] = [
    {
      label: 'Default',
      content: (
        <>
          <Button title="Open sheet" onPress={() => setVisible(true)} />
          <BottomSheet visible={visible} onClose={() => setVisible(false)}>
            <Title style={{ marginBottom: 8 }}>Bottom sheet</Title>
            <Body>Drag the handle down, or tap outside, to dismiss.</Body>
          </BottomSheet>
        </>
      ),
    },
  ];
  return <VariantList variants={variants} />;
  // #endregion demo
}
