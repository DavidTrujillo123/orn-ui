import React from 'react';
import { View } from 'react-native';
import { InfoRow, useTheme } from 'orn-ui';
import { VariantList, type VariantDef } from '@/components/VariantList';

function DetailListExample() {
  const theme = useTheme();
  return (
    // Rows sit further apart than label and value, so each row reads as one fact.
    <View style={{ gap: theme.tokens.spacing.lg }}>
      <InfoRow icon="user" label="Name" value="Jane Cooper" placeholder="No name" />
      <InfoRow icon="home" label="Address" value="4517 Washington Ave" placeholder="No address yet" />
      <InfoRow icon="star" label="Membership" value={null} placeholder="Not a member" />
    </View>
  );
}

export function InfoRowDemo() {
  // #region demo
  const variants: VariantDef[] = [
    { label: 'With value', content: <InfoRow icon="user" label="Name" value="Jane Cooper" placeholder="No name" /> },
    {
      label: 'Missing value — placeholder',
      content: <InfoRow icon="home" label="Address" value={undefined} placeholder="No address yet" />,
    },
    {
      label: 'Long value wraps',
      content: (
        <InfoRow
          icon="home"
          label="Address"
          value="4517 Washington Ave, Apartment 12B, Manchester, Kentucky 39495"
          placeholder="No address yet"
        />
      ),
    },
    {
      label: 'Detail list',
      content: <DetailListExample />,
    },
  ];
  return <VariantList variants={variants} />;
  // #endregion demo
}
