import React, { useState } from 'react';
import { View } from 'react-native';
import { Body, Card, NavigationBar, Subtitle, type NavigationBarItem } from 'orn-ui';
import { VariantList, type VariantDef } from '@/components/VariantList';

const TABS: NavigationBarItem[] = [
  { key: 'home', label: 'Home', iconName: 'home' },
  { key: 'search', label: 'Search', iconName: 'search' },
  { key: 'alerts', label: 'Alerts', iconName: 'alert', badge: 3 },
  { key: 'profile', label: 'Profile', iconName: 'user' },
];

const SCREENS: Record<string, string> = {
  home: 'Everything that happened since your last visit.',
  search: 'Search clients, invoices or payments.',
  alerts: 'Three invoices are due this week.',
  profile: 'Your account and the app preferences.',
};

function TabbedScreenExample() {
  const [active, setActive] = useState('home');
  return (
    <View style={{ gap: 12 }}>
      <Card>
        <Subtitle>{TABS.find((tab) => tab.key === active)?.label}</Subtitle>
        <Body style={{ marginTop: 4 }}>{SCREENS[active]}</Body>
      </Card>
      <NavigationBar items={TABS} activeKey={active} onChange={setActive} safeArea={false} />
    </View>
  );
}

function LabelsAndBadgeExample() {
  const [active, setActive] = useState('search');
  return <NavigationBar items={TABS} activeKey={active} onChange={setActive} safeArea={false} />;
}

function IconsOnlyExample() {
  const [active, setActive] = useState('search');
  return <NavigationBar items={TABS} activeKey={active} onChange={setActive} showLabels={false} safeArea={false} />;
}

function TopBarExample() {
  const [active, setActive] = useState('search');
  return <NavigationBar items={TABS} activeKey={active} onChange={setActive} position="top" safeArea={false} />;
}

function SafeAreaExample() {
  const [active, setActive] = useState('search');
  return <NavigationBar items={TABS} activeKey={active} onChange={setActive} />;
}

export function NavigationBarDemo() {
  // #region demo
  const variants: VariantDef[] = [
    { label: 'with the tab content', content: <TabbedScreenExample /> },
    { label: 'default — labels + badge', content: <LabelsAndBadgeExample /> },
    { label: 'showLabels={false} — icons only', content: <IconsOnlyExample /> },
    { label: 'position="top"', content: <TopBarExample /> },
    // The indicator lives outside the safe area: with the inset inside the
    // bar's padding, it used to stretch all the way to the edge of the screen.
    { label: 'safeArea — the indicator stays above the home bar', content: <SafeAreaExample /> },
  ];
  return <VariantList variants={variants} />;
  // #endregion demo
}
