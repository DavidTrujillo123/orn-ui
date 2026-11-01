import React from 'react';
import { Text } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { UIProvider } from '../../theme/UIProvider';
import { Avatar, initialsOf } from '../Avatar';

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

  const at = (el: React.ReactElement) => render(<UIProvider mode="light">{el}</UIProvider>);

  it.each([
    ['Ada Lovelace', 'AL'],
    ['ada', 'A'],
    ['  María José  de la Cruz ', 'MC'],
    ['', ''],
  ])('initialsOf(%j) is %j', (name, expected) => {
    expect(initialsOf(name)).toBe(expected);
  });

  it('shows initials sized to the circle and announces the name as an image', () => {
    at(<Avatar name="Ada Lovelace" size={50} />);
    expect(screen.getByText('AL')).toHaveStyle({ fontSize: 20 });
    expect(screen.getByRole('image', { name: 'Ada Lovelace' })).toBeOnTheScreen();
  });

  it('falls back from a broken photo to the initials', () => {
    const { Image } = require('react-native');
    at(<Avatar name="Ada Lovelace" source={{ uri: 'https://example.com/x.png' }} />);
    expect(screen.queryByText('AL')).toBeNull();
    fireEvent(screen.UNSAFE_getByType(Image), 'error');
    expect(screen.getByText('AL')).toBeOnTheScreen();
  });

  it('without photo or name shows the user icon and stays decorative', () => {
    at(<Avatar testID="av" />);
    expect(screen.getByTestId('av').props.accessible).toBe(false);
  });
});

