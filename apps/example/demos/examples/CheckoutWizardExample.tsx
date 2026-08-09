import React, { useState } from 'react';
import { View } from 'react-native';
import {
  Body,
  Caption,
  Checkbox,
  DateField,
  Divider,
  Input,
  KeyValueRow,
  OptionCard,
  Wizard,
  useToast,
  type WizardStep,
} from 'orn-ui';

const SHIPPING_COST = 12;

// Fuera del render: `new Date()` adentro devuelve un objeto distinto en cada
// pasada, y DateField recibe un `minDate` nuevo cada vez que se tipea en
// cualquier campo del wizard.
const TODAY = new Date();
const IN_TWO_MONTHS = new Date(TODAY.getFullYear(), TODAY.getMonth() + 2, TODAY.getDate());

/**
 * CheckoutWizardExample
 * Checkout de 4 pasos que ata Wizard + Steps con validación real por paso:
 * cada `canGoNext` refleja el estado del formulario, así que Next queda
 * bloqueado hasta completar el paso. Al terminar dispara un Toast.
 */
export function CheckoutWizardExample() {
  const { show } = useToast();

  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [deliveryDate, setDeliveryDate] = useState<Date | undefined>();
  const [payment, setPayment] = useState<'card' | 'cash' | undefined>();
  const [accepted, setAccepted] = useState(false);

  const emailValid = /.+@.+\..+/.test(email);

  const steps: WizardStep[] = [
    {
      label: 'Contact',
      description: 'How we reach you',
      canGoNext: emailValid,
      content: (
        <Input
          label="Email"
          required
          placeholder="you@example.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          error={email.length > 0 && !emailValid ? 'Enter a valid email' : undefined}
        />
      ),
    },
    {
      label: 'Delivery',
      description: 'Where and when',
      canGoNext: address.trim().length > 3 && !!deliveryDate,
      content: (
        <View>
          <Input label="Address" required placeholder="221B Baker Street" value={address} onChangeText={setAddress} />
          <DateField
            label="Delivery date"
            required
            value={deliveryDate}
            onChange={setDeliveryDate}
            minDate={TODAY}
            maxDate={IN_TWO_MONTHS}
          />
        </View>
      ),
    },
    {
      label: 'Payment',
      canGoNext: !!payment,
      content: (
        <View style={{ gap: 12 }}>
          <Caption>How would you like to pay?</Caption>
          <View style={{ flexDirection: 'row', gap: 8 }} accessibilityRole="radiogroup">
            <OptionCard
              label="Card"
              description="Visa ···4821"
              iconName="check"
              isSelected={payment === 'card'}
              onPress={() => setPayment('card')}
            />
            <OptionCard
              label="Cash"
              description="On delivery"
              iconName="info"
              isSelected={payment === 'cash'}
              onPress={() => setPayment('cash')}
            />
          </View>
        </View>
      ),
    },
    {
      label: 'Review',
      canGoNext: accepted,
      content: (
        <View style={{ gap: 10 }}>
          <KeyValueRow label="Email" value={email || '—'} />
          <KeyValueRow label="Address" value={address || '—'} />
          <KeyValueRow label="Delivery" value={deliveryDate ? deliveryDate.toDateString() : '—'} />
          <KeyValueRow label="Payment" value={payment ?? '—'} />
          <Divider style={{ marginVertical: 4 }} />
          <KeyValueRow
            label="Shipping"
            value={`$${SHIPPING_COST.toFixed(2)}`}
            labelStyle={{ fontWeight: '700' }}
            valueStyle={{ fontWeight: '700' }}
          />
          <Checkbox value={accepted} onValueChange={setAccepted} label="I accept the terms" />
        </View>
      ),
    },
  ];

  return (
    <View style={{ flex: 1, paddingHorizontal: 20 }}>
      <Body style={{ marginBottom: 16 }}>
        Four steps, each gated by its own validation — Next stays disabled until the current step is complete.
      </Body>
      <Wizard
        steps={steps}
        finishLabel="Place order"
        onFinish={() => show({ title: 'Order placed', message: `Confirmation sent to ${email}`, variant: 'success' })}
      />
    </View>
  );
}
