import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Body, Button, Card, Caption, Subtitle, Transition, type TransitionPreset } from 'orn-ui';
import { VariantList, type VariantDef } from '@/components/VariantList';

function Toggle({ preset, distance }: { preset: TransitionPreset | TransitionPreset[]; distance?: number }) {
  const [visible, setVisible] = useState(true);

  return (
    <View style={{ gap: 12 }}>
      <Button title={visible ? 'Hide' : 'Show'} variant="outline" onPress={() => setVisible((v) => !v)} />
      <View style={{ height: 120, justifyContent: 'center' }}>
        <Transition visible={visible} preset={preset} distance={distance}>
          <Card>
            <Subtitle>Order #4821</Subtitle>
            <Body style={{ marginTop: 4 }}>2 items · standard shipping</Body>
          </Card>
        </Transition>
      </View>
    </View>
  );
}

const ROWS = ['Acme Studio', 'Bright Labs', 'Northwind', 'Contoso'];

function StaggeredList() {
  const [round, setRound] = useState(0);

  return (
    <View style={{ gap: 12 }}>
      <Button title="Replay" variant="outline" onPress={() => setRound((r) => r + 1)} />
      <View key={round} style={{ gap: 8 }}>
        {ROWS.map((name, i) => (
          <Transition key={name} preset={['fade', 'slide-up']} delay={i * 70}>
            <Card>
              <Body>{name}</Body>
            </Card>
          </Transition>
        ))}
      </View>
    </View>
  );
}

function ExitBeforeUnmount() {
  const [items, setItems] = useState(ROWS);
  const [removing, setRemoving] = useState<string | null>(null);

  useEffect(() => {
    if (items.length === 0) {
      const id = setTimeout(() => setItems(ROWS), 900);
      return () => clearTimeout(id);
    }
  }, [items]);

  return (
    <View style={{ gap: 8 }}>
      <Caption>Cada fila se anima al salir antes de desmontarse.</Caption>
      {items.map((name) => (
        <Transition
          key={name}
          visible={removing !== name}
          preset={['fade', 'slide-left']}
          onExited={() => {
            setItems((current) => current.filter((n) => n !== name));
            setRemoving(null);
          }}
        >
          <Button title={`Remove ${name}`} variant="ghost" onPress={() => setRemoving(name)} />
        </Transition>
      ))}
    </View>
  );
}

export function TransitionDemo() {
  // #region demo
  const variants: VariantDef[] = [
    { label: 'fade (default)', content: <Toggle preset="fade" /> },
    { label: "preset={['fade', 'slide-up']}", content: <Toggle preset={['fade', 'slide-up']} distance={32} /> },
    { label: "preset='pop' — spring", content: <Toggle preset="pop" /> },
    { label: "preset={['fade', 'slide-right']}", content: <Toggle preset={['fade', 'slide-right']} distance={48} /> },
    { label: 'delay por índice — lista escalonada', content: <StaggeredList /> },
    { label: 'salida antes del desmontaje', content: <ExitBeforeUnmount /> },
  ];
  return <VariantList variants={variants} />;
  // #endregion demo
}
