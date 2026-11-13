import React, { useState } from 'react';
import { Alert, Button } from 'orn-ui';
import { VariantList, type VariantDef } from '@/components/VariantList';

function SuccessExample() {
  const [visible, setVisible] = useState(false);
  return (
    <>
      <Button title="Send invoice" onPress={() => setVisible(true)} />
      <Alert visible={visible} type="success" title="Invoice sent" onClose={() => setVisible(false)} />
    </>
  );
}

function ErrorExample() {
  const [visible, setVisible] = useState(false);
  return (
    <>
      <Button title="Pay" onPress={() => setVisible(true)} />
      <Alert
        visible={visible}
        type="error"
        title="Payment failed"
        message="Please try another card."
        onClose={() => setVisible(false)}
      />
    </>
  );
}

function WarningExample() {
  const [visible, setVisible] = useState(false);
  return (
    <>
      <Button title="Leave" variant="outline" onPress={() => setVisible(true)} />
      <Alert
        visible={visible}
        type="warning"
        title="Unsaved changes"
        message="You'll lose your edits."
        onClose={() => setVisible(false)}
      />
    </>
  );
}

function ConfirmDeleteExample() {
  const [visible, setVisible] = useState(false);
  return (
    <>
      <Button title="Delete invoice" variant="destructive" onPress={() => setVisible(true)} />
      <Alert
        visible={visible}
        type="question"
        title="Delete invoice?"
        message="This cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        destructive
        onConfirm={() => setVisible(false)}
        onCancel={() => setVisible(false)}
      />
    </>
  );
}

function CustomButtonsExample() {
  const [visible, setVisible] = useState(false);
  return (
    <>
      <Button title="Export" variant="outline" onPress={() => setVisible(true)} />
      <Alert
        visible={visible}
        type="info"
        title="Export invoice"
        buttons={[
          // One filled button: the main choice stands out (Von Restorff).
          { text: 'PDF', onPress: () => setVisible(false) },
          { text: 'CSV', variant: 'outline', onPress: () => setVisible(false) },
          { text: 'Cancel', variant: 'ghost', onPress: () => setVisible(false) },
        ]}
      />
    </>
  );
}

export function AlertDemo() {
  // #region demo
  const variants: VariantDef[] = [
    { label: 'success', content: <SuccessExample /> },
    { label: 'error — with message', content: <ErrorExample /> },
    { label: 'warning', content: <WarningExample /> },
    { label: 'question — destructive confirm', content: <ConfirmDeleteExample /> },
    { label: 'custom buttons — three stack vertically', content: <CustomButtonsExample /> },
  ];
  return <VariantList variants={variants} />;
  // #endregion demo
}
