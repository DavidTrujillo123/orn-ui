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

  const insets = { top: 47, bottom: 34, left: 0, right: 0 };

  it('clears the safe area by default and skips it with safeArea={false}', () => {
    const { rerender } = render(
      <UIProvider mode="light" insets={insets}>
        <Fab onPress={() => {}} accessibilityLabel="Create" testID="fab" />
      </UIProvider>
    );
    // spacing.xl (20) + insets.bottom (34)
    expect(screen.getByTestId('fab')).toHaveStyle({ bottom: 54, right: 20 });

    rerender(
      <UIProvider mode="light" insets={insets}>
        <Fab onPress={() => {}} accessibilityLabel="Create" testID="fab" safeArea={false} bottom={8} />
      </UIProvider>
    );
    expect(screen.getByTestId('fab')).toHaveStyle({ bottom: 8, right: 20 });
  });

  it('a light custom color gets a dark icon for contrast', () => {
    render(
      <UIProvider mode="light">
        <Fab onPress={() => {}} accessibilityLabel="Search" iconName="search" color="#7ce3f0" testID="fab" />
      </UIProvider>
    );
    // The 'search' glyph is drawn with borders: with the fix they are black;
    // before they were `onPrimary` (white) over the cyan, unreadable.
    const tree = JSON.stringify(screen.toJSON());
    expect(tree).toMatch(/"borderColor":"#000"/);
    expect(tree).not.toMatch(/"borderColor":"#ffffff"/i);
  });
});
