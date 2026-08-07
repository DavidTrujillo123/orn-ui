import React from 'react';
import { render } from '@testing-library/react-native';
import { UIProvider } from '../../theme/UIProvider';
import { Divider } from '../Divider';

describe('Divider', () => {
  it('renders without crashing', () => {
    const { toJSON } = render(
      <UIProvider mode="light">
        <Divider testID="divider" />
      </UIProvider>
    );
    expect(toJSON()).toBeTruthy();
  });
});
