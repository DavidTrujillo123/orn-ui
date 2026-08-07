import React from 'react';
import { View } from 'react-native';
import { Button, Toast, useToast } from 'orn-ui';
import { VariantList, type VariantDef } from '@/components/VariantList';

export function ToastDemo() {
  const { show, hideAll } = useToast();
  // #region demo
  const variants: VariantDef[] = [
    {
      label: 'Imperative — useToast().show()',
      content: (
        <View style={{ gap: 8 }}>
          <Button title="Success" onPress={() => show({ title: 'Invoice sent', variant: 'success' })} />
          <Button
            title="Error"
            variant="outline"
            onPress={() => show({ title: 'Payment failed', message: 'Try another card.', variant: 'error' })}
          />
          <Button
            title="Warning"
            variant="outline"
            onPress={() => show({ title: 'Unsaved changes', variant: 'warning' })}
          />
          <Button title="Info" variant="outline" onPress={() => show({ title: 'Syncing…', variant: 'info' })} />
        </View>
      ),
    },
    {
      label: 'Options: duration, tappable, stacking',
      content: (
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
      ),
    },
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
