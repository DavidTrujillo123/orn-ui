import React, { memo } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { useColors } from '../theme/UIProvider';

export interface DividerProps {
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export const Divider = memo(({ style, testID }: DividerProps) => {
  const colors = useColors();
  return <View testID={testID} style={[{ height: 1, backgroundColor: colors.border, width: '100%' }, style]} />;
});
Divider.displayName = 'Divider';
