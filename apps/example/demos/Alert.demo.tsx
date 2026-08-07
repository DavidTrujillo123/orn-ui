import React, { useState } from 'react';
import { Button, Alert as OrnAlert } from 'orn-ui';
import { VariantList, type VariantDef } from '@/components/VariantList';

type Kind = 'success' | 'error' | 'warning' | 'info' | 'question' | 'custom';

export function AlertDemo() {
  const [visible, setVisible] = useState<Kind | null>(null);
  // #region demo
  const variants: VariantDef[] = [
    {
      label: 'success',
      content: (
        <>
          <Button title="Show success" variant="outline" onPress={() => setVisible('success')} />
          <OrnAlert visible={visible === 'success'} title="Invoice sent" type="success" onClose={() => setVisible(null)} />
        </>
      ),
    },
    {
      label: 'error',
      content: (
        <>
          <Button title="Show error" variant="outline" onPress={() => setVisible('error')} />
          <OrnAlert visible={visible === 'error'} title="Payment failed" message="Please try another card." type="error" onClose={() => setVisible(null)} />
        </>
      ),
    },
    {
      label: 'warning',
      content: (
        <>
          <Button title="Show warning" variant="outline" onPress={() => setVisible('warning')} />
          <OrnAlert visible={visible === 'warning'} title="Unsaved changes" message="You'll lose your edits." type="warning" onClose={() => setVisible(null)} />
        </>
      ),
    },
    {
      label: 'question (confirm)',
      content: (
        <>
          <Button title="Delete invoice" variant="destructive" onPress={() => setVisible('question')} />
          <OrnAlert
            visible={visible === 'question'}
            title="Delete invoice?"
            message="This cannot be undone."
            type="question"
            confirmText="Delete"
            cancelText="Cancel"
            onConfirm={() => setVisible(null)}
            onCancel={() => setVisible(null)}
          />
        </>
      ),
    },
    {
      label: 'custom buttons',
      content: (
        <>
          <Button title="Show custom buttons" variant="outline" onPress={() => setVisible('custom')} />
          <OrnAlert
            visible={visible === 'custom'}
            title="Export invoice"
            type="info"
            buttons={[
              { text: 'PDF', onPress: () => setVisible(null) },
              { text: 'CSV', onPress: () => setVisible(null) },
              { text: 'Cancel', style: 'cancel', variant: 'outline', onPress: () => setVisible(null) },
            ]}
          />
        </>
      ),
    },
  ];
  return <VariantList variants={variants} />;
  // #endregion demo
}
