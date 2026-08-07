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
 * Resuelve el glifo vía el renderer activo (UIProvider.icons, default zero-dep
 * si no se configuró ninguno). Uso interno de la librería — los componentes
 * públicos exponen `icon?: ReactNode` además de esto, para que el consumidor
 * pueda inyectar cualquier ícono sin pasar por el sistema de nombres.
 */
export const Icon = memo(({ name, size = 20, color, style }: IconProps) => {
  const colors = useColors();
  const render = useIcons();
  const glyph = render(name, { size, color: color ?? colors.text });
  if (!style) return <>{glyph}</>;
  return <View style={style}>{glyph}</View>;
});
Icon.displayName = 'Icon';
