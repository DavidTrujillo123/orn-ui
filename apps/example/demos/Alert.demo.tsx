import React, { useState } from 'react';
import { View } from 'react-native';
import { Alert, Button } from 'orn-ui';
import { VariantList, type VariantDef } from '@/components/VariantList';

// The examples start open and use `inline` so the dialog is drawn inside this
// box. In your app, drop `inline`: the dialog then covers the whole screen.
const BOX = { height: 400, justifyContent: 'flex-end' as const };

function SuccessExample() {
  const [visible, setVisible] = useState(true);
  return (
    <View style={BOX}>
      <Button title="Send invoice" onPress={() => setVisible(true)} />
      <Alert inline visible={visible} type="success" title="Invoice sent" onClose={() => setVisible(false)} />
    </View>
  );
}

function ErrorExample() {
  const [visible, setVisible] = useState(true);
  return (
    <View style={BOX}>
      <Button title="Pay" onPress={() => setVisible(true)} />
      <Alert
        inline
        visible={visible}
        type="error"
        title="Payment failed"
        message="Please try another card."
        onClose={() => setVisible(false)}
      />
    </View>
  );
}

function WarningExample() {
  const [visible, setVisible] = useState(true);
  return (
    <View style={BOX}>
      <Button title="Leave" variant="outline" onPress={() => setVisible(true)} />
      <Alert
        inline
        visible={visible}
        type="warning"
        title="Unsaved changes"
        message="You'll lose your edits."
        onClose={() => setVisible(false)}
      />
    </View>
  );
}

function ConfirmDeleteExample() {
  const [visible, setVisible] = useState(true);
  return (
    <View style={BOX}>
      <Button title="Delete invoice" variant="destructive" onPress={() => setVisible(true)} />
      <Alert
        inline
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
    </View>
  );
}

function CustomButtonsExample() {
  const [visible, setVisible] = useState(true);
  return (
    <View style={BOX}>
      <Button title="Export" variant="outline" onPress={() => setVisible(true)} />
      <Alert
        inline
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
    </View>
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
