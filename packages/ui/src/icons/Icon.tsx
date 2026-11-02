import React, { memo } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { useColors, useIcons } from '../theme/UIProvider';
import type { IconName } from './types';

export interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * Icon
 * Resolves the glyph through the active renderer (UIProvider.icons, the
 * zero-dep default if none was configured). Internal use by the library —
 * public components expose `icon?: ReactNode` in addition to this, so the
 * consumer can inject any icon without going through the name system.
 */
export const Icon = memo(({ name, size = 20, color, style }: IconProps) => {
  const colors = useColors();
  const render = useIcons();
  const glyph = render(name, { size, color: color ?? colors.text });
  if (!style) return <>{glyph}</>;
  return <View style={style}>{glyph}</View>;
});
Icon.displayName = 'Icon';
