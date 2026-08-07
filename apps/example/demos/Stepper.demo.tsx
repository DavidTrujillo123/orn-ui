import React, { useState } from 'react';
import { Stepper } from 'orn-ui';
import { VariantList, type VariantDef } from '@/components/VariantList';

export function StepperDemo() {
  const [qty, setQty] = useState('1');
  const [qtySmall, setQtySmall] = useState('3');
  // #region demo
  const variants: VariantDef[] = [
    {
      label: 'size="md"',
      content: (
        <Stepper
          value={qty}
          onChangeText={setQty}
          onIncrement={() => setQty((q) => String(Number(q) + 1))}
          onDecrement={() => setQty((q) => String(Math.max(0, Number(q) - 1)))}
        />
      ),
    },
    {
      label: 'size="sm"',
      content: (
        <Stepper
          value={qtySmall}
          onChangeText={setQtySmall}
          onIncrement={() => setQtySmall((q) => String(Number(q) + 1))}
          onDecrement={() => setQtySmall((q) => String(Math.max(0, Number(q) - 1)))}
          size="sm"
        />
      ),
    },
  ];
  return <VariantList variants={variants} />;
  // #endregion demo
}
