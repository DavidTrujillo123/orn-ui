import React, { useState } from 'react';
import { View } from 'react-native';
import {
  Badge,
  BottomSheet,
  Body,
  Button,
  Caption,
  Card,
  Checkbox,
  Divider,
  InfoRow,
  KeyValueRow,
  Select,
  ThemeToggle,
  Subtitle,
  useAlert,
  useToast,
} from 'orn-ui';

const LANGUAGES = [
  { label: 'English', value: 'en' },
  { label: 'Spanish', value: 'es' },
  { label: 'Portuguese', value: 'pt' },
];

/**
 * SettingsScreenExample
 * Pantalla de ajustes: el caso donde ThemeToggle se ve trabajar de verdad —
 * cambiar el modo repinta toda la app en el acto, no sólo esta tarjeta. Suma
 * preferencias con Checkbox, un Select de idioma, la sesión en InfoRow y una
 * zona de riesgo con confirmación destructiva.
 */
export function SettingsScreenExample() {
  const { confirm } = useAlert();
  const { show } = useToast();

  const [language, setLanguage] = useState<string | undefined>('es');
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailDigest, setEmailDigest] = useState(false);
  const [analytics, setAnalytics] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);

  const handleSignOut = async () => {
    const ok = await confirm({
      title: 'Sign out?',
      message: 'You will need your password to get back in.',
      destructive: true,
      confirmText: 'Sign out',
    });
    if (ok) show({ title: 'Signed out', variant: 'info' });
  };

  return (
    <View style={{ paddingHorizontal: 20, gap: 16 }}>
      <Card>
        <Subtitle>Appearance</Subtitle>
        <Caption style={{ marginTop: 4, marginBottom: 12 }}>
          Auto follows the system. Light and Dark override it for the whole app.
        </Caption>
        <ThemeToggle />
      </Card>

      <Card>
        <Subtitle>Account</Subtitle>
        <View style={{ marginTop: 12, gap: 12 }}>
          <InfoRow icon="info" label="Signed in as" value="acme@studio.com" placeholder="—" />
          <Divider />
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Body>Plan</Body>
            <Badge label="PRO" variant="success" />
          </View>
          <KeyValueRow label="Renews on" value="Sep 1, 2026" />
          <KeyValueRow label="Seats" value="4 of 10" />
        </View>
      </Card>

      <Card>
        <Subtitle>Preferences</Subtitle>
        <View style={{ marginTop: 12, gap: 4 }}>
          <Select label="Language" options={LANGUAGES} selectedValue={language} onSelect={setLanguage} />
          <Checkbox value={pushEnabled} onValueChange={setPushEnabled} label="Push notifications" />
          <Checkbox value={emailDigest} onValueChange={setEmailDigest} label="Weekly email digest" />
          <Checkbox value={analytics} onValueChange={setAnalytics} label="Share anonymous usage data" />
        </View>
        <Button
          title="What do we collect?"
          variant="link"
          onPress={() => setSheetOpen(true)}
          style={{ alignSelf: 'flex-start', marginTop: 4 }}
        />
      </Card>

      <Card>
        <Subtitle>Danger zone</Subtitle>
        <Caption style={{ marginTop: 4, marginBottom: 12 }}>Signing out clears the local cache on this device.</Caption>
        <Button title="Sign out" variant="destructive" onPress={handleSignOut} />
      </Card>

      <BottomSheet visible={sheetOpen} onClose={() => setSheetOpen(false)}>
        <Subtitle style={{ marginBottom: 8 }}>Anonymous usage data</Subtitle>
        <Body>
          Screen names, crash traces and device model. Never form contents, never anything that identifies you.
        </Body>
        <Button title="Got it" onPress={() => setSheetOpen(false)} style={{ marginTop: 20 }} />
      </BottomSheet>
    </View>
  );
}
