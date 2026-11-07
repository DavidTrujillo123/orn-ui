import React, { useState } from 'react';
import { View } from 'react-native';
import { Wizard, Input, Body, Checkbox, Select, KeyValueRow, type WizardStep } from 'orn-ui';
import { VariantList, type VariantDef } from '@/components/VariantList';

const SIMPLE: WizardStep[] = [
  { label: 'Account', content: <Body>Step 1 — collect the account details.</Body> },
  { label: 'Payment', content: <Body>Step 2 — choose how to pay.</Body> },
  { label: 'Confirm', content: <Body>Step 3 — review and finish.</Body> },
];

const PLANS = [
  { label: 'Free', value: 'free' },
  { label: 'Pro', value: 'pro' },
];

function SignupWizardExample() {
  const [email, setEmail] = useState('');
  const [plan, setPlan] = useState<string | undefined>();
  const [accepted, setAccepted] = useState(false);

  // Real per-step validation: Next stays disabled until the current step
  // is complete.
  const steps: WizardStep[] = [
    {
      label: 'Account',
      description: 'Email',
      canGoNext: email.includes('@'),
      content: (
        <Input
          label="Email"
          required
          placeholder="you@example.com"
          value={email}
          onChangeText={setEmail}
          error={email.length > 0 && !email.includes('@') ? 'Enter a valid email' : undefined}
        />
      ),
    },
    {
      label: 'Plan',
      canGoNext: !!plan,
      content: <Select label="Plan" required options={PLANS} selectedValue={plan} onSelect={setPlan} />,
    },
    {
      label: 'Confirm',
      canGoNext: accepted,
      content: (
        <View style={{ gap: 12 }}>
          <KeyValueRow label="Email" value={email || '—'} />
          <KeyValueRow label="Plan" value={PLANS.find((p) => p.value === plan)?.label ?? '—'} />
          <Checkbox value={accepted} onValueChange={setAccepted} label="I accept the terms" />
        </View>
      ),
    },
  ];

  return (
    <View style={{ height: 340 }}>
      <Wizard steps={steps} nextLabel="Continue" finishLabel="Create account" onFinish={() => {}} />
    </View>
  );
}

export function WizardDemo() {
  // #region demo
  const variants: VariantDef[] = [
    {
      label: 'Basic — three steps, uncontrolled',
      content: (
        <View style={{ height: 280 }}>
          <Wizard steps={SIMPLE} onFinish={() => {}} />
        </View>
      ),
    },
    {
      label: 'Vertical indicator',
      content: (
        <View style={{ height: 380 }}>
          <Wizard steps={SIMPLE} orientation="vertical" onFinish={() => {}} />
        </View>
      ),
    },
    {
      label: 'Numbers instead of checks',
      content: (
        <View style={{ height: 280 }}>
          <Wizard steps={SIMPLE} completedIndicator="number" onFinish={() => {}} />
        </View>
      ),
    },
    {
      label: 'Per-step validation (canGoNext)',
      content: <SignupWizardExample />,
    },
    {
      label: 'Custom labels',
      content: (
        <View style={{ height: 280 }}>
          <Wizard steps={SIMPLE} backLabel="Previous" nextLabel="Continue" finishLabel="Done" onFinish={() => {}} />
        </View>
      ),
    },
  ];
  return <VariantList variants={variants} />;
  // #endregion demo
}
