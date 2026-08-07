import React from 'react';
import { PressableScale, Body, Card } from 'orn-ui';
import { VariantList, type VariantDef } from '@/components/VariantList';

export function PressableScaleDemo() {
  // #region demo
  const variants: VariantDef[] = [
    {
      label: 'Default (0.96)',
      content: (
        <PressableScale onPress={() => {}}>
          <Card>
            <Body>Press me — I scale down.</Body>
          </Card>
        </PressableScale>
      ),
    },
    {
      label: 'scaleTo=0.85',
      content: (
        <PressableScale onPress={() => {}} scaleTo={0.85}>
          <Card>
            <Body>A bigger squeeze on press.</Body>
          </Card>
        </PressableScale>
      ),
    },
  ];
  return <VariantList variants={variants} />;
  // #endregion demo
}
