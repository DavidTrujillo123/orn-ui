import React, { memo } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '../theme/UIProvider';
import type { Tokens } from '../theme/tokens';

export interface DividerProps {
  /** `vertical` separates items in a row and stretches to the row's height. @default 'horizontal' */
  orientation?: 'horizontal' | 'vertical';
  /** Space on each side of the line, from the spacing scale. Unset, the line adds no margin. */
  spacing?: keyof Tokens['spacing'];
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/**
 * Divider
 * 1pt line in `colors.border`.
 *
 * Gestalt: separates groups when proximity alone isn't enough (dense lists,
 * rows spanning the whole screen). If spacing already separates the groups,
 * prefer spacing: one line too many fragments what should read together.
 * `spacing` takes its room from the token scale so the separation is the
 * same across the whole app, instead of a different margin on each screen.
 *
 * It is decorative: it doesn't enter the accessibility tree.
 */
export const Divider = memo(({ orientation = 'horizontal', spacing, style, testID }: DividerProps) => {
  const theme = useTheme();
  const gap = spacing ? theme.tokens.spacing[spacing] : 0;
  const line: ViewStyle =
    orientation === 'vertical'
      ? { width: 1, alignSelf: 'stretch', marginHorizontal: gap }
      : { height: 1, width: '100%', marginVertical: gap };
  return (
    <View
      testID={testID}
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
      style={[line, { backgroundColor: theme.colors.border }, style]}
    />
  );
});
Divider.displayName = 'Divider';
