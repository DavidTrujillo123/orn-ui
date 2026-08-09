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
  home: 'Everything that happened since your last visit.',
  search: 'Search clients, invoices or payments.',
  alerts: 'Three invoices are due this week.',
  profile: 'Your account and the app preferences.',
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
      label: 'with the tab content',
      content: <TabbedScreen />,
    },
    {
      label: 'default — labels + badge',
      content: <ControlledBar />,
    },
    {
      label: 'showLabels={false} — icons only',
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
