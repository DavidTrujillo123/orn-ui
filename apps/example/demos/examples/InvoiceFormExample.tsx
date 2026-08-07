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
  KeyValueRow,
  Modal,
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
 * Flujo real de "nueva factura": botón que abre un Modal (bottom-sheet)
 * con un form completo — AvatarHeader + Input + Stepper + Select +
 * Checkbox + KeyValueRow calculado + FormActions — y confirma con Alert
 * imperativo al guardar. Combina 9 componentes de las tres capas.
 */
export function InvoiceFormExample() {
  const { alert } = useAlert();
  const [visible, setVisible] = useState(false);
  const [description, setDescription] = useState('Website design');
  const [quantity, setQuantity] = useState('2');
  const [unitPrice, setUnitPrice] = useState('150');
  const [payment, setPayment] = useState<string | undefined>('card');
  const [markPaid, setMarkPaid] = useState(false);

  // Number('') es 0 pero Number('12.5.5') es NaN, y el teclado numérico de
  // Android deja escribir varios puntos: sin este guard el total se mostraba
  // como "$NaN" en cuanto el precio quedaba a medio tipear.
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

      <Modal
        visible={visible}
        onClose={() => setVisible(false)}
        title="New invoice"
        variant="bottomSheet"
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
      </Modal>
    </View>
  );
}
