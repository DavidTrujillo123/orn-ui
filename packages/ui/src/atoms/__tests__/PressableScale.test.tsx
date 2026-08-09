import React from 'react';
import { Text } from 'react-native';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { PressableScale } from '../PressableScale';

describe('PressableScale', () => {
  it('renders its children', () => {
    render(
      <PressableScale>
        <Text>press me</Text>
      </PressableScale>
    );
    expect(screen.getByText('press me')).toBeOnTheScreen();
  });

  it('forwards onPress', () => {
    const onPress = jest.fn();
    render(
      <PressableScale onPress={onPress} testID="p">
        <Text>go</Text>
      </PressableScale>
    );
    fireEvent.press(screen.getByTestId('p'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('scales the same node it styles, so the whole box follows the gesture', () => {
    render(
      <PressableScale style={{ borderRadius: 12 }} testID="p">
        <Text>go</Text>
      </PressableScale>
    );
    const style = screen.getByTestId('p').props.style;
    expect(style).toMatchObject({ borderRadius: 12 });
    expect(style.transform).toEqual([{ scale: 1 }]);
  });

  it('does not fire onPressIn when disabled (RN Pressable blocks all touch events)', () => {
    const onPressIn = jest.fn();
    render(
      <PressableScale disabled onPressIn={onPressIn} testID="p">
        <Text>go</Text>
      </PressableScale>
    );
    fireEvent(screen.getByTestId('p'), 'pressIn');
    expect(onPressIn).not.toHaveBeenCalled();
  });
});
