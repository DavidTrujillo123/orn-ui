import React from 'react';
import { View } from 'react-native';
import { Fab, useColors } from 'orn-ui';
import { VariantList, type VariantDef } from '@/components/VariantList';

// En el catálogo el Fab vive dentro de una tarjeta, no al pie de la pantalla:
// por eso safeArea={false} y bottom/right en 0. En una pantalla real se deja
// el default y el botón queda por encima de la barra de inicio.
function Frame({ children }: { children: React.ReactNode }) {
  return <View style={{ height: 96 }}>{children}</View>;
}

function CustomColor() {
  const colors = useColors();
  return (
    <Frame>
      <Fab
        onPress={() => {}}
        accessibilityLabel="Add expense"
        color={colors.warning}
        safeArea={false}
        bottom={0}
        right={0}
      />
    </Frame>
  );
}

export function FabDemo() {
  // #region demo
  const variants: VariantDef[] = [
    {
      label: 'default — primary fill, plus icon',
      content: (
        <Frame>
          <Fab onPress={() => {}} accessibilityLabel="Create invoice" safeArea={false} bottom={0} right={0} />
        </Frame>
      ),
    },
    { label: 'color — the icon picks black or white for contrast', content: <CustomColor /> },
    {
      label: 'size and iconName',
      content: (
        <Frame>
          <Fab onPress={() => {}} accessibilityLabel="Search" iconName="search" size={48} safeArea={false} bottom={0} right={0} />
        </Frame>
      ),
    },
  ];
  return <VariantList variants={variants} />;
  // #endregion demo
}
