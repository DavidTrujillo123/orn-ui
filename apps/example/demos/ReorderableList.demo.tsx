import React, { useState } from 'react';
import { View } from 'react-native';
import { ReorderableList, Card, Body, Caption, useColors } from 'orn-ui';
import { VariantList, type VariantDef } from '@/components/VariantList';

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

export function ReorderableListDemo() {
  const [tasks, setTasks] = useState(INITIAL);

  // #region demo
  const variants: VariantDef[] = [
    {
      label: 'drag any row to reorder — the rows in between shift together',
      content: (
        <View style={{ width: '100%' }}>
          <ReorderableList
            data={tasks}
            itemHeight={ROW_HEIGHT}
            keyExtractor={(item) => item.id}
            onReorder={setTasks}
            renderItem={(item) => <DraggableRow title={item.title} />}
          />
        </View>
      ),
    },
  ];
  return <VariantList variants={variants} />;
  // #endregion demo
}
