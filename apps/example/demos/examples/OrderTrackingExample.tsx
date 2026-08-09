import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import {
  Badge,
  Button,
  Caption,
  Card,
  Divider,
  EmptyState,
  Image,
  KeyValueRow,
  Spinner,
  Steps,
  Subtitle,
  useToast,
  type StepItem,
} from 'orn-ui';

const STAGES = ['Order placed', 'Packed', 'In transit', 'Delivered'];
const STAGE_DETAIL = [
  'We received your payment.',
  'Your items left the warehouse shelf.',
  'On the truck, heading to your address.',
  'Left at the front door.',
];

const PRODUCT_IMAGE = 'https://picsum.photos/seed/orn-ui-order/200/200';

/**
 * OrderTrackingExample
 * Estado que avanza solo: el pedido sube un escalón cada 2.5s, así que Steps,
 * Badge y el resumen se ven cambiar sin tocar nada — a diferencia de los demos
 * por componente, que son estáticos. Cubre además los dos estados que una
 * pantalla real siempre necesita y los catálogos suelen saltear: la carga
 * inicial y el pedido inexistente.
 */
export function OrderTrackingExample() {
  const { show } = useToast();
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);
  const [stage, setStage] = useState(0);
  // Sin este guard el toast de "delivered" se repetía en cada tick una vez
  // alcanzada la última etapa.
  const announced = useRef(false);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 900);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (loading || missing) return;
    const id = setInterval(() => {
      setStage((s) => Math.min(s + 1, STAGES.length - 1));
    }, 2500);
    return () => clearInterval(id);
  }, [loading, missing]);

  // El toast se dispara desde un efecto, no desde el updater de setStage:
  // React reejecuta los updaters durante el render, y mostrarlo ahí actualizaba
  // el ToastProvider mientras se renderizaba este componente.
  useEffect(() => {
    if (loading || missing || stage < STAGES.length - 1 || announced.current) return;
    announced.current = true;
    show({ title: 'Delivered', message: 'Order #4821 arrived.', variant: 'success' });
  }, [loading, missing, stage, show]);

  const reset = useCallback(() => {
    announced.current = false;
    setStage(0);
    setMissing(false);
    setLoading(true);
    setTimeout(() => setLoading(false), 900);
  }, []);

  if (loading) {
    return (
      <View style={{ paddingHorizontal: 20, paddingTop: 40 }}>
        <Spinner text="Loading order…" fullscreen={false} />
      </View>
    );
  }

  if (missing) {
    return (
      <View style={{ paddingHorizontal: 20, paddingTop: 20 }}>
        <EmptyState
          iconName="search"
          title="Order not found"
          description="Nothing matches #0000. Check the number on your receipt."
        />
        <Button title="Back to order #4821" onPress={reset} style={{ marginTop: 16 }} />
      </View>
    );
  }

  const delivered = stage === STAGES.length - 1;
  const steps: StepItem[] = STAGES.map((label, i) => ({ label, description: STAGE_DETAIL[i] }));

  return (
    <View style={{ paddingHorizontal: 20, gap: 16 }}>
      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <Image source={{ uri: PRODUCT_IMAGE }} width={64} height={64} radius={12} priority="high" />
          <View style={{ flex: 1 }}>
            <Subtitle>Order #4821</Subtitle>
            <Caption>2 items · Standard shipping</Caption>
          </View>
          <Badge
            label={delivered ? 'DELIVERED' : 'IN PROGRESS'}
            variant={delivered ? 'success' : 'warning'}
          />
        </View>

        <Divider style={{ marginVertical: 16 }} />

        <Steps steps={steps} current={stage} orientation="vertical" />
      </Card>

      <Card>
        <Subtitle>Summary</Subtitle>
        <View style={{ marginTop: 12 }}>
          <KeyValueRow label="Items" value="$84.00" style={{ marginBottom: 8 }} />
          <KeyValueRow label="Shipping" value="$12.00" style={{ marginBottom: 8 }} />
          <KeyValueRow
            label="Total"
            value="$96.00"
            labelStyle={{ fontWeight: '700' }}
            valueStyle={{ fontWeight: '700' }}
          />
        </View>
      </Card>

      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={{ flex: 1 }}>
          <Button title="Restart" variant="outline" onPress={reset} />
        </View>
        <View style={{ flex: 1 }}>
          <Button title="Track #0000" variant="ghost" onPress={() => setMissing(true)} />
        </View>
      </View>

      <Caption style={{ textAlign: 'center' }}>The order advances one stage every 2.5s.</Caption>
    </View>
  );
}
