import React from 'react';
import { View } from 'react-native';
import { Body, Button, Toast, showToast, useToast } from 'orn-ui';
import { VariantList, type VariantDef } from '@/components/VariantList';

function VariantsExample() {
  const { show } = useToast();
  return (
    <View style={{ gap: 8 }}>
      <Button title="Success" onPress={() => show({ title: 'Invoice sent', variant: 'success' })} />
      <Button
        title="Error"
        variant="outline"
        onPress={() => show({ title: 'Payment failed', message: 'Try another card.', variant: 'error' })}
      />
      <Button title="Warning" variant="outline" onPress={() => show({ title: 'Unsaved changes', variant: 'warning' })} />
      <Button title="Info" variant="outline" onPress={() => show({ title: 'Syncing…', variant: 'info' })} />
    </View>
  );
}

// A plain function, no React: showToast works from services, stores or
// API clients, as long as a ToastProvider is mounted.
function archiveInvoice(id: string) {
  showToast({ title: `Invoice #${id} archived`, variant: 'success' });
}

function BusinessLogicExample() {
  return (
    <View style={{ gap: 8 }}>
      <Body>The button calls a plain function that imports showToast.</Body>
      <Button title="Archive invoice #4821" variant="outline" onPress={() => archiveInvoice('4821')} />
    </View>
  );
}

function OptionsExample() {
  const { show, hideAll } = useToast();
  return (
    <View style={{ gap: 8 }}>
      <Button
        title="Stays until dismissed"
        variant="outline"
        onPress={() => show({ title: 'Sticky toast', message: 'duration: 0', duration: 0 })}
      />
      <Button
        title="Tappable"
        variant="outline"
        onPress={() => show({ title: 'Tap me', message: 'Runs onPress and closes', onPress: () => {} })}
      />
      <Button
        title="Fire three at once"
        variant="outline"
        onPress={() => {
          show({ title: 'First', variant: 'info' });
          show({ title: 'Second', variant: 'success' });
          show({ title: 'Third', variant: 'warning' });
        }}
      />
      <Button title="Dismiss all" variant="ghost" onPress={hideAll} />
    </View>
  );
}

export function ToastDemo() {
  // #region demo
  const variants: VariantDef[] = [
    { label: 'Imperative — useToast().show()', content: <VariantsExample /> },
    { label: 'From business logic — showToast(), no hook', content: <BusinessLogicExample /> },
    { label: 'Options: duration, tappable, stacking', content: <OptionsExample /> },
    {
      label: 'Static (placed by hand, no provider)',
      content: (
        <View style={{ gap: 8 }}>
          <Toast title="Invoice sent" message="Sent to acme@studio.com" variant="success" />
          <Toast title="Payment failed" variant="error" onDismiss={() => {}} />
        </View>
      ),
    },
  ];
  return <VariantList variants={variants} />;
  // #endregion demo
}
