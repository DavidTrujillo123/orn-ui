import React, { memo } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useColors } from '../theme/UIProvider';

export interface AvatarProps {
  size?: number;
  backgroundColor?: string;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

const styles = StyleSheet.create({
  circle: { justifyContent: 'center', alignItems: 'center' },
});

/**
 * Avatar
 * Círculo con ícono/iniciales adentro. Usado a la izquierda de filas de
 * lista o como header de detalle (junto a AvatarHeader).
 */
export const Avatar = memo(({ size = 44, backgroundColor, children, style }: AvatarProps) => {
  const colors = useColors();
  return (
    <View
      style={[
        styles.circle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: backgroundColor || colors.primarySoft,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
});
Avatar.displayName = 'Avatar';
