import React, { useState } from 'react';
import { View } from 'react-native';
import {
  Avatar,
  Body,
  Button,
  Caption,
  Card,
  Checkbox,
  Divider,
  Icon,
  Input,
  Title,
  useAlert,
  useToast,
} from 'orn-ui';

/** The only credential that "exists": everything else bounces like in a real backend. */
const VALID = { email: 'acme@studio.com', password: 'orn-ui' };

/**
 * SignInExample
 * Login with the part sample forms usually leave out: the error path. It
 * validates on submit (not while typing, which accuses before the user is
 * done), blocks the button with `loading` during the request and tells the
 * field failure — painted under the Input — apart from the credentials
 * failure, which goes to an Alert because it doesn't belong to any field.
 */
export function SignInExample() {
  const { alert } = useAlert();
  const { show } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validate = () => {
    const next: typeof errors = {};
    if (!/.+@.+\..+/.test(email)) next.email = 'Enter a valid email address';
    if (password.length < 6) next.password = 'At least 6 characters';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 1200));
    setSubmitting(false);

    if (email.trim().toLowerCase() !== VALID.email || password !== VALID.password) {
      await alert({
        title: 'Wrong credentials',
        message: `Try ${VALID.email} with the password "${VALID.password}".`,
        type: 'error',
      });
      return;
    }
    setSignedIn(true);
    show({ title: 'Welcome back', message: email, variant: 'success' });
  };

  if (signedIn) {
    return (
      <View style={{ paddingHorizontal: 20 }}>
        <Card>
          <View style={{ alignItems: 'center', gap: 12 }}>
            <Avatar size={64}>
              <Icon name="check" size={30} />
            </Avatar>
            <Title>You are in</Title>
            <Caption style={{ textAlign: 'center' }}>
              {remember ? 'This device will stay signed in.' : 'You will be asked again next time.'}
            </Caption>
            <Button
              title="Sign out"
              variant="outline"
              onPress={() => {
                setSignedIn(false);
                setPassword('');
              }}
              style={{ marginTop: 8, alignSelf: 'stretch' }}
            />
          </View>
        </Card>
      </View>
    );
  }

  return (
    <View style={{ paddingHorizontal: 20 }}>
      <Card>
        <Title>Sign in</Title>
        <Caption style={{ marginTop: 4, marginBottom: 20 }}>
          Use {VALID.email} / {VALID.password}. Anything else takes the error path.
        </Caption>

        <Input
          label="Email"
          required
          placeholder="you@example.com"
          value={email}
          onChangeText={(t) => {
            setEmail(t);
            // Clears the field's error as soon as it's edited: leaving it while
            // the user corrects it marks it red when they're already fixing it.
            if (errors.email) setErrors((e) => ({ ...e, email: undefined }));
          }}
          keyboardType="email-address"
          autoCapitalize="none"
          error={errors.email}
        />

        <Input
          label="Password"
          required
          placeholder="••••••"
          value={password}
          onChangeText={(t) => {
            setPassword(t);
            if (errors.password) setErrors((e) => ({ ...e, password: undefined }));
          }}
          isPassword
          error={errors.password}
        />

        <Checkbox value={remember} onValueChange={setRemember} label="Keep me signed in" />

        <Button
          title="Sign in"
          onPress={handleSubmit}
          loading={submitting}
          rightIconName="chevron-right"
          style={{ marginTop: 20 }}
        />

        <Divider style={{ marginVertical: 20 }} />

        <Body style={{ textAlign: 'center' }}>Forgot your password?</Body>
        <Button
          title="Email me a reset link"
          variant="link"
          onPress={() => show({ title: 'Reset link sent', message: 'Check your inbox.', variant: 'info' })}
        />
      </Card>
    </View>
  );
}
