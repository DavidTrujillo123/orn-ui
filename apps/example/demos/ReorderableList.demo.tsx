import React, { useState } from 'react';
import { View } from 'react-native';
import { ReorderableList, Card, Body, Caption, useColors } from 'orn-ui';
import { VariantList, useVariantScrollLock, type VariantDef } from '@/components/VariantList';

interface Task {
  id: string;
  title: string;
}

const INITIAL: Task[] = [
  { id: '1', title: 'Design review' },
  { id: '2', title: 'Write tests' },
  { id: '3', title: 'Ship release' },
  { id: '4', title: 'Update docs' },
];

const ROW_HEIGHT = 60;

function DraggableRow({ title }: { title: string }) {
  const colors = useColors();
  return (
    <Card style={{ height: ROW_HEIGHT - 8, marginBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <Caption style={{ color: colors.textLight, fontSize: 18 }}>⠿</Caption>
      <Body style={{ flex: 1 }}>{title}</Body>
    </Card>
  );
}

// #region demo
function TaskList() {
  const [tasks, setTasks] = useState(INITIAL);
  // El scroll vertical que envuelve al demo compite con el arrastre: en iOS el
  // UIScrollView cancela los toques del contenido apenas su gesto arranca y la
  // fila nunca llega a moverse. Se apaga mientras dura el drag.
  const setScrollLocked = useVariantScrollLock();

  return (
    <View style={{ width: '100%' }}>
      <ReorderableList
        data={tasks}
        itemHeight={ROW_HEIGHT}
        keyExtractor={(item) => item.id}
        onReorder={setTasks}
        onDragStart={() => setScrollLocked(true)}
        onDragEnd={() => setScrollLocked(false)}
        renderItem={(item) => <DraggableRow title={item.title} />}
      />
    </View>
  );
}

export function ReorderableListDemo() {
  const variants: VariantDef[] = [
    {
      label: 'drag any row to reorder — the rows in between shift together',
      content: <TaskList />,
    },
  ];
  return <VariantList variants={variants} />;
}
// #endregion demo
