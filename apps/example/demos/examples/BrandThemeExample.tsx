import React, { useState } from 'react';
import { TouchableOpacity, View } from 'react-native';
import {
  Badge,
  Body,
  Button,
  Caption,
  Card,
  Checkbox,
  Icon,
  Input,
  NavigationBar,
  Steps,
  Subtitle,
  useColors,
  type NavigationBarItem,
} from 'orn-ui';
import { BRANDS, useBrand } from '@/components/BrandProvider';

const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

const STEPS = [{ label: 'Cart' }, { label: 'Payment' }, { label: 'Done' }];

const TABS: NavigationBarItem[] = [
  { key: 'home', label: 'Home', iconName: 'check' },
  { key: 'search', label: 'Search', iconName: 'search' },
  { key: 'profile', label: 'Profile', iconName: 'info' },
];

/**
 * BrandThemeExample
 * Un solo hex repinta toda la app: de `brand.primary` salen los cuatro roles
 * del acento (relleno, lo que va encima, el fondo tenue y la variante legible
 * sobre superficie) en light y en dark. Al elegir un color cambian también las
 * otras pestañas: el cambio es global, no de esta pantalla.
 */
export function BrandThemeExample() {
  const { brand, setBrand } = useBrand();
  const colors = useColors();
  const [custom, setCustom] = useState('');
  const [tab, setTab] = useState('home');
  const [accepted, setAccepted] = useState(true);

  const customError = custom.length > 0 && !HEX.test(custom) ? 'A hex like #7c3aed' : undefined;

  return (
    <View style={{ paddingHorizontal: 20, gap: 16 }}>
      <Card>
        <Subtitle>Brand color</Subtitle>
        <Caption style={{ marginTop: 4 }}>
          createTheme({'{'} brand: '{brand}' {'}'}) — one hex, and the four accent roles come out of it in both
          schemes.
        </Caption>

        <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
          {BRANDS.map((option) => {
            const selected = option.hex.toLowerCase() === brand.toLowerCase();
            return (
              <TouchableOpacity
                key={option.hex}
                onPress={() => setBrand(option.hex)}
                accessibilityRole="button"
                accessibilityLabel={option.label}
                accessibilityState={{ selected }}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: option.hex,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: selected ? 3 : 0,
                  borderColor: colors.text,
                }}
              >
                {selected && <Icon name="check" size={20} color="#ffffff" />}
              </TouchableOpacity>
            );
          })}
        </View>

        <Input
          label="Or your own hex"
          placeholder="#7c3aed"
          value={custom}
          onChangeText={(text) => {
            setCustom(text);
            if (HEX.test(text)) setBrand(text);
          }}
          autoCapitalize="none"
          error={customError}
          containerStyle={{ marginTop: 20, marginBottom: 0 }}
        />
      </Card>

      <Card>
        <Subtitle>What gets repainted</Subtitle>
        <Caption style={{ marginTop: 4, marginBottom: 16 }}>
          No component knows the hex: they all read theme roles.
        </Caption>

        <View style={{ gap: 12 }}>
          <Button title="Primary" onPress={() => {}} />
          <Button title="Outline" variant="outline" onPress={() => {}} />
          <Button title="Link" variant="link" onPress={() => {}} />
          <Badge label="INFO" variant="info" />
          <Checkbox value={accepted} onValueChange={setAccepted} label="Checked box" />
          <Steps steps={STEPS} current={1} />
          <NavigationBar items={TABS} activeKey={tab} onChange={setTab} safeArea={false} />
        </View>
      </Card>
    </View>
  );
}
