import React from 'react';
import { Text } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { UIProvider } from '../../theme/UIProvider';
import { Avatar } from '../Avatar';

describe('Avatar', () => {
  it('renders its children centered inside the circle', () => {
    render(
      <UIProvider mode="light">
        <Avatar size={40}>
          <Text>AB</Text>
        </Avatar>
      </UIProvider>
    );
    expect(screen.getByText('AB')).toBeOnTheScreen();
  });
});
