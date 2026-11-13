import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import {
  AvatarHeader,
  Body,
  Button,
  Card,
  Checkbox,
  Divider,
  FormActions,
  Input,
  BottomSheet,
  KeyValueRow,
  Select,
  Stepper,
  Title,
  useAlert,
} from 'orn-ui';

const PAYMENT_METHODS = [
  { label: 'Cash', value: 'cash' },
  { label: 'Card', value: 'card' },
  { label: 'Bank transfer', value: 'transfer' },
];

const TAX_RATE = 0.15;

/**
 * InvoiceFormExample
 * A real "new invoice" flow: a button that opens a BottomSheet with a full
 * form — AvatarHeader + Input + Stepper + Select +
 * Checkbox + computed KeyValueRow + FormActions — and confirms with an
 * imperative Alert on save. Combines 9 components from the three layers.
 */
export function InvoiceFormExample() {
  const { alert } = useAlert();
  const [visible, setVisible] = useState(false);
  const [description, setDescription] = useState('Website design');
  const [quantity, setQuantity] = useState('2');
  const [unitPrice, setUnitPrice] = useState('150');
  const [payment, setPayment] = useState<string | undefined>('card');
  const [markPaid, setMarkPaid] = useState(false);

  // Number('') is 0 but Number('12.5.5') is NaN, and Android's numeric
  // keyboard lets you type several dots: without this guard the total showed
  // as "$NaN" as soon as the price was half-typed.
  const toAmount = (raw: string) => {
    const n = Number(raw);
    return Number.isFinite(n) && n >= 0 ? n : 0;
  };

  const subtotal = useMemo(() => toAmount(quantity) * toAmount(unitPrice), [quantity, unitPrice]);
  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax;

  const handleSave = async () => {
    setVisible(false);
    await alert({ title: 'Invoice saved', message: `Total billed: $${total.toFixed(2)}`, type: 'success' });
  };

  return (
    <View style={{ paddingHorizontal: 20 }}>
      <Card>
        <Title>New invoice</Title>
        <Body style={{ marginTop: 4 }}>
          Opens a bottom-sheet form: client header, line item, payment method and a live total.
        </Body>
        <Button title="New invoice" onPress={() => setVisible(true)} style={{ marginTop: 16 }} leftIconName="plus" />
      </Card>

      <BottomSheet
        visible={visible}
        onClose={() => setVisible(false)}
        title="New invoice"
        // A long form: while typing, the actions give their strip back to the
        // field being edited (with 'fixed' only one field fit above the keyboard).
        footerPlacement="hide-with-keyboard"
        footer={
          <FormActions
            primaryLabel="Save invoice"
            onPrimaryPress={handleSave}
            secondaryLabel="Cancel"
            onSecondaryPress={() => setVisible(false)}
          />
        }
      >
        <AvatarHeader initials="AS" title="Acme Studio" subtitle="acme@studio.com" />

        <Input label="Description" value={description} onChangeText={setDescription} />

        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
          <View style={{ flex: 1 }}>
            <Body style={{ marginBottom: 8, fontWeight: '500' }}>Quantity</Body>
            <Stepper
              block
              value={quantity}
              onChangeText={setQuantity}
              onIncrement={() => setQuantity((q) => String(toAmount(q) + 1))}
              onDecrement={() => setQuantity((q) => String(Math.max(0, toAmount(q) - 1)))}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Input label="Unit price" value={unitPrice} onChangeText={setUnitPrice} keyboardType="numeric" />
          </View>
        </View>

        <Select label="Payment method" options={PAYMENT_METHODS} selectedValue={payment} onSelect={setPayment} />

        <Checkbox value={markPaid} onValueChange={setMarkPaid} label="Mark as already paid" />

        <Divider style={{ marginVertical: 16 }} />

        <KeyValueRow label="Subtotal" value={`$${subtotal.toFixed(2)}`} style={{ marginBottom: 8 }} />
        <KeyValueRow label={`Tax (${TAX_RATE * 100}%)`} value={`$${tax.toFixed(2)}`} style={{ marginBottom: 8 }} />
        <KeyValueRow
          label="Total"
          value={`$${total.toFixed(2)}`}
          labelStyle={{ fontWeight: '700', fontSize: 15 }}
          valueStyle={{ fontWeight: '700', fontSize: 15 }}
        />
      </BottomSheet>
    </View>
  );
}
