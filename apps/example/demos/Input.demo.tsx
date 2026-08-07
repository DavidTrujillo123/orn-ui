import React, { useState } from 'react';
import { Input } from 'orn-ui';
import { VariantList, type VariantDef } from '@/components/VariantList';

export function InputDemo() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [search, setSearch] = useState('orn-ui');
  // #region demo
  const variants: VariantDef[] = [
    {
      label: 'Default',
      content: (
        <Input label="Email" required placeholder="you@example.com" value={email} onChangeText={setEmail} leftIconName="info" />
      ),
    },
    { label: 'Password', content: <Input label="Password" isPassword value={password} onChangeText={setPassword} /> },
    {
      label: 'Clearable',
      content: (
        <Input
          label="Search"
          value={search}
          onChangeText={setSearch}
          leftIconName="search"
          rightIconName={search.length > 0 ? 'close' : undefined}
          onRightIconPress={() => setSearch('')}
        />
      ),
    },
    { label: 'Error', content: <Input label="Email" error="This field is required" value="" onChangeText={() => {}} /> },
    { label: 'Loading', content: <Input label="Checking availability" isLoading value="" onChangeText={() => {}} /> },
    { label: 'Read-only', content: <Input label="Read-only" value="Cannot be edited" editable={false} onChangeText={() => {}} /> },
  ];
  return <VariantList variants={variants} />;
  // #endregion demo
}
