import React from 'react';
import { Title, Subtitle, Body, Caption, useColors } from 'orn-ui';
import { VariantList, type VariantDef } from '@/components/VariantList';

function PrimaryTextExample() {
  const colors = useColors();
  return <Body color={colors.primary}>Text with an explicit color override</Body>;
}

export function TextDemo() {
  // #region demo
  const variants: VariantDef[] = [
    { label: 'Title', content: <Title>Invoice #1042</Title> },
    { label: 'Title, multiline', content: <Title>Quarterly report for the north region warehouses</Title> },
    { label: 'Subtitle', content: <Subtitle>Due in 5 days</Subtitle> },
    {
      label: 'Subtitle, multiline',
      content: <Subtitle>Payment is due in 5 days, after that a late fee of 2% applies</Subtitle>,
    },
    { label: 'Body', content: <Body>Body text, the default paragraph style for most content.</Body> },
    { label: 'Caption', content: <Caption>Caption, used for secondary hints and metadata.</Caption> },
    {
      label: 'Caption, multiline',
      content: (
        <Caption>
          Updated 3 minutes ago by the billing service. Amounts include taxes and are shown in your local currency.
        </Caption>
      ),
    },
    { label: 'align="center"', content: <Body align="center">Centered text</Body> },
    { label: 'custom color', content: <PrimaryTextExample /> },
  ];
  return <VariantList variants={variants} />;
  // #endregion demo
}
