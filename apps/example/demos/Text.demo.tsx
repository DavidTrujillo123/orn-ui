import React from 'react';
import { Title, Subtitle, Body, Caption } from 'orn-ui';
import { VariantList, type VariantDef } from '@/components/VariantList';

export function TextDemo() {
  // #region demo
  const variants: VariantDef[] = [
    { label: 'Title', content: <Title>Invoice #1042</Title> },
    { label: 'Subtitle', content: <Subtitle>Due in 5 days</Subtitle> },
    { label: 'Body', content: <Body>Body text, the default paragraph style for most content.</Body> },
    { label: 'Caption', content: <Caption>Caption, used for secondary hints and metadata.</Caption> },
    { label: 'align="center"', content: <Body align="center">Centered text</Body> },
    { label: 'custom color', content: <Body color="#00cae1">Text with an explicit color override</Body> },
  ];
  return <VariantList variants={variants} />;
  // #endregion demo
}
