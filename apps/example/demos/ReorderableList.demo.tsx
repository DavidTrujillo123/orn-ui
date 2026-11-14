import React, { useState } from 'react';
import { Body, Caption, Card, ReorderableList, useColors } from 'orn-ui';
import { VariantList, type VariantDef } from '@/components/VariantList';

interface Task {
  id: string;
  title: string;
}

const TASKS: Task[] = [
  { id: '1', title: 'Design review' },
  { id: '2', title: 'Write tests' },
  { id: '3', title: 'Ship release' },
  { id: '4', title: 'Update docs' },
];

const ROW_HEIGHT = 60;

function TaskRow({ task, dragging }: { task: Task; dragging: boolean }) {
  const colors = useColors();
  return (
    <Card
      style={{
        height: ROW_HEIGHT - 8,
        marginBottom: 8,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        // The row being dragged lifts off the list.
        borderColor: dragging ? colors.primary : colors.border,
      }}
    >
      <Caption style={{ color: colors.textLight, fontSize: 18 }}>⠿</Caption>
      <Body style={{ flex: 1 }}>{task.title}</Body>
    </Card>
  );
}

function TaskListExample() {
  const [tasks, setTasks] = useState(TASKS);
  return (
    <ReorderableList
      data={tasks}
      itemHeight={ROW_HEIGHT}
      keyExtractor={(task) => task.id}
      onReorder={setTasks}
      renderItem={(task, _index, dragging) => <TaskRow task={task} dragging={dragging} />}
    />
  );
}

function LockedListExample() {
  return (
    <ReorderableList
      data={TASKS}
      itemHeight={ROW_HEIGHT}
      keyExtractor={(task) => task.id}
      onReorder={() => {}}
      renderItem={(task) => <TaskRow task={task} dragging={false} />}
      disabled
    />
  );
}

export function ReorderableListDemo() {
  // #region demo
  const variants: VariantDef[] = [
    { label: 'drag any row — the rows in between shift together', content: <TaskListExample /> },
    { label: 'disabled — the order is fixed', content: <LockedListExample /> },
  ];
  // `fill`: the demo has no vertical pager competing with the drag.
  return <VariantList variants={variants} fill />;
  // #endregion demo
}
