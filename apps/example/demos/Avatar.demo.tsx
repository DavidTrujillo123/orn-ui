import React from 'react';
import { Avatar, Icon, Body } from 'orn-ui';
import { VariantList, VariantRow, type VariantDef } from '@/components/VariantList';

export function AvatarDemo() {
  // #region demo
  const variants: VariantDef[] = [
    {
      label: 'With icon',
      content: (
        <Avatar size={44}>
          <Icon name="check" size={20} />
        </Avatar>
      ),
    },
    {
      label: 'With initials',
      content: (
        <Avatar size={44}>
          <Body style={{ fontWeight: '700' }}>JD</Body>
        </Avatar>
      ),
    },
    {
      label: 'Sizes',
      content: (
        <VariantRow>
          <Avatar size={28}>
            <Body style={{ fontWeight: '700', fontSize: 11 }}>SM</Body>
          </Avatar>
          <Avatar size={44}>
            <Body style={{ fontWeight: '700' }}>MD</Body>
          </Avatar>
          <Avatar size={64}>
            <Body style={{ fontWeight: '700', fontSize: 18 }}>LG</Body>
          </Avatar>
        </VariantRow>
      ),
    },
    {
      label: 'Custom color',
      content: (
        <Avatar size={44} backgroundColor="#00cae130">
          <Icon name="info" size={22} color="#00cae1" />
        </Avatar>
      ),
    },
  ];
  return <VariantList variants={variants} />;
  // #endregion demo
}
