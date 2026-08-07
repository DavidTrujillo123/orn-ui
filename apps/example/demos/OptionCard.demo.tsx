import React, { useState } from 'react';
import { View } from 'react-native';
import { OptionCard } from 'orn-ui';
import { VariantList, type VariantDef } from '@/components/VariantList';

export function OptionCardDemo() {
  const [selected, setSelected] = useState<'cash' | 'card'>('cash');
  const [selectedVertical, setSelectedVertical] = useState<'cash' | 'card' | 'transfer'>('card');
  // #region demo
  const variants: VariantDef[] = [
    {
      label: 'layout="horizontal"',
      content: (
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <OptionCard label="Cash" iconName="check" isSelected={selected === 'cash'} onPress={() => setSelected('cash')} />
          <OptionCard label="Card" iconName="info" isSelected={selected === 'card'} onPress={() => setSelected('card')} />
        </View>
      ),
    },
    {
      label: 'layout="vertical"',
      content: (
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <OptionCard
            label="Cash"
            iconName="check"
            layout="vertical"
            isSelected={selectedVertical === 'cash'}
            onPress={() => setSelectedVertical('cash')}
          />
          <OptionCard
            label="Card"
            iconName="info"
            layout="vertical"
            isSelected={selectedVertical === 'card'}
            onPress={() => setSelectedVertical('card')}
          />
          <OptionCard
            label="Transfer"
            iconName="search"
            layout="vertical"
            isSelected={selectedVertical === 'transfer'}
            onPress={() => setSelectedVertical('transfer')}
          />
        </View>
      ),
    },
  ];
  return <VariantList variants={variants} />;
  // #endregion demo
}
