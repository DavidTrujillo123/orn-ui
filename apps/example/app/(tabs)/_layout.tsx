import React from 'react';
import { Tabs } from 'expo-router';
import { Icon, useColors } from 'orn-ui';
import type { IconName } from 'orn-ui';

const ICONS: Record<string, IconName> = {
  atoms: 'check',
  molecules: 'plus',
  organisms: 'search',
  examples: 'info',
};

export default function TabsLayout() {
  const colors = useColors();
  return (
    <Tabs
      initialRouteName="atoms"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textLight,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
      }}
    >
      <Tabs.Screen name="index" options={{ href: null }} />
      <Tabs.Screen
        name="atoms"
        options={{ title: 'Atoms', tabBarIcon: ({ color, size }) => <Icon name={ICONS.atoms} color={color as string} size={size} /> }}
      />
      <Tabs.Screen
        name="molecules"
        options={{ title: 'Molecules', tabBarIcon: ({ color, size }) => <Icon name={ICONS.molecules} color={color as string} size={size} /> }}
      />
      <Tabs.Screen
        name="organisms"
        options={{ title: 'Organisms', tabBarIcon: ({ color, size }) => <Icon name={ICONS.organisms} color={color as string} size={size} /> }}
      />
      <Tabs.Screen
        name="examples"
        options={{ title: 'Examples', tabBarIcon: ({ color, size }) => <Icon name={ICONS.examples} color={color as string} size={size} /> }}
      />
    </Tabs>
  );
}
