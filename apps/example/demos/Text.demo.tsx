import React from 'react';
import { Title, Subtitle, Body, Caption } from 'orn-ui';
import { VariantList, type VariantDef } from '@/components/VariantList';

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
    { label: 'align="center"', content: <Body align="center">Centered text</Body> },
    { label: 'custom color', content: <Body color="#00cae1">Text with an explicit color override</Body> },
  ];
  return <VariantList variants={variants} />;
  // #endregion demo
}
