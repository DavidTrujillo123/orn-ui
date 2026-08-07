import React from 'react';
import { render } from '@testing-library/react-native';
import { renderDefaultIcon } from '../defaultIcons';
import type { IconName } from '../types';

const ALL_NAMES: IconName[] = [
  'check',
  'close',
  'chevron-down',
  'chevron-up',
  'chevron-left',
  'chevron-right',
  'eye',
  'eye-off',
  'search',
  'plus',
  'minus',
  'alert',
  'info',
  'warning',
  'question',
];

describe('renderDefaultIcon', () => {
  it.each(ALL_NAMES)('renders %s without throwing', (name) => {
    const { toJSON } = render(<>{renderDefaultIcon(name, { size: 20, color: '#000' })}</>);
    expect(toJSON()).toBeTruthy();
  });
});
