import React from 'react';
import { render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { Icon } from '../Icon';
import { UIProvider } from '../../theme/UIProvider';

describe('Icon', () => {
  it('uses the default renderer when none is provided', () => {
    const { toJSON } = render(
      <UIProvider mode="light">
        <Icon name="check" />
      </UIProvider>
    );
    expect(toJSON()).toBeTruthy();
  });

  it('prefers the icons renderer injected via UIProvider', () => {
    const { getByTestId } = render(
      <UIProvider mode="light" icons={(name) => <Text testID="custom-icon">{name}</Text>}>
        <Icon name="close" />
      </UIProvider>
    );
    expect(getByTestId('custom-icon')).toHaveTextContent('close');
  });

  it('falls back to theme.colors.text when no color is passed', () => {
    const spy = jest.fn().mockReturnValue(null);
    render(
      <UIProvider mode="light" icons={spy}>
        <Icon name="search" />
      </UIProvider>
    );
    expect(spy).toHaveBeenCalledWith('search', { size: 20, color: '#333333' });
  });
});
