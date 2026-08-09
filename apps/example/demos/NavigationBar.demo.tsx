import React, { useState } from 'react';
import { View } from 'react-native';
import { Body, Card, NavigationBar, Subtitle, type NavigationBarItem } from 'orn-ui';
import { VariantList, type VariantDef } from '@/components/VariantList';

const ITEMS: NavigationBarItem[] = [
  { key: 'home', label: 'Home', iconName: 'check' },
  { key: 'search', label: 'Search', iconName: 'search' },
  { key: 'alerts', label: 'Alerts', iconName: 'alert', badge: 3 },
  { key: 'profile', label: 'Profile', iconName: 'info' },
];

const SCREENS: Record<string, string> = {
  home: 'Todo lo que pasó desde tu última visita.',
  search: 'Buscá clientes, facturas o pagos.',
  alerts: 'Tres facturas vencen esta semana.',
  profile: 'Tu cuenta y las preferencias de la app.',
};

function TabbedScreen() {
  const [active, setActive] = useState('home');

  return (
    <View style={{ gap: 12 }}>
      <Card>
        <Subtitle>{ITEMS.find((i) => i.key === active)?.label}</Subtitle>
        <Body style={{ marginTop: 4 }}>{SCREENS[active]}</Body>
      </Card>
      <NavigationBar items={ITEMS} activeKey={active} onChange={setActive} safeArea={false} />
    </View>
  );
}

function ControlledBar(props: { showLabels?: boolean; position?: 'top' | 'bottom' }) {
  const [active, setActive] = useState('search');
  return <NavigationBar items={ITEMS} activeKey={active} onChange={setActive} safeArea={false} {...props} />;
}

export function NavigationBarDemo() {
  // #region demo
  const variants: VariantDef[] = [
    {
      label: 'con el contenido de la pestaña',
      content: <TabbedScreen />,
    },
    {
      label: 'default — labels + badge',
      content: <ControlledBar />,
    },
    {
      label: 'showLabels={false} — sólo íconos',
      content: <ControlledBar showLabels={false} />,
    },
    {
      label: 'position="top"',
      content: <ControlledBar position="top" />,
    },
  ];
  return <VariantList variants={variants} />;
  // #endregion demo
}
