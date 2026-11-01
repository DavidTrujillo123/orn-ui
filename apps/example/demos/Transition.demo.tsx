import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Body, Button, Card, Caption, Subtitle, Transition, type TransitionPreset } from 'orn-ui';
import { VariantList, type VariantDef } from '@/components/VariantList';

// Los demos se animan solos (y el botón sigue funcionando): una transición
// que hay que tocar para ver no se puede grabar para la docs, y es justo lo
// que la docs tiene que mostrar.
const AUTO_TOGGLE_MS = 1600;
const AUTO_REPLAY_MS = 3000;
const AUTO_REMOVE_MS = 900;

function Toggle({ preset, distance }: { preset: TransitionPreset | TransitionPreset[]; distance?: number }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const id = setInterval(() => setVisible((v) => !v), AUTO_TOGGLE_MS);
    return () => clearInterval(id);
  }, []);

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

  useEffect(() => {
    const id = setInterval(() => setRound((r) => r + 1), AUTO_REPLAY_MS);
    return () => clearInterval(id);
  }, []);

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
      const id = setTimeout(() => setItems(ROWS), AUTO_REMOVE_MS);
      return () => clearTimeout(id);
    }
    // Sin toques, va sacando la primera fila: cada una sale animada.
    if (removing) return;
    const id = setTimeout(() => setRemoving(items[0]!), AUTO_REMOVE_MS);
    return () => clearTimeout(id);
  }, [items, removing]);

  return (
    <View style={{ gap: 8 }}>
      <Caption>Each row animates out before it unmounts.</Caption>
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
    { label: 'delay per index — staggered list', content: <StaggeredList /> },
    { label: 'exit before unmount', content: <ExitBeforeUnmount /> },
  ];
  return <VariantList variants={variants} />;
  // #endregion demo
}
