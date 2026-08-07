import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { UIProvider } from '../../theme/UIProvider';
import { Fab } from '../Fab';

describe('Fab', () => {
  it('is reachable by accessibility label and calls onPress', () => {
    const onPress = jest.fn();
    render(
      <UIProvider mode="light">
        <Fab onPress={onPress} accessibilityLabel="Create" />
      </UIProvider>
    );
    fireEvent.press(screen.getByRole('button', { name: 'Create' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
