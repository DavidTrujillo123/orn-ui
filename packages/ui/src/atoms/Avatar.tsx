import React, { memo, useState } from 'react';
import {
  Image as RNImage,
  StyleSheet,
  Text,
  View,
  type ImageSourcePropType,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useAllowFontScaling, useColors, useTheme } from '../theme/UIProvider';
import { Icon } from '../icons/Icon';
import type { IconName } from '../icons/types';

export interface AvatarProps {
  /** Diameter in pt. @default 44 */
  size?: number;
  /** Photo. If it fails to load, falls back to the initials of `name` (or the icon). */
  source?: ImageSourcePropType;
  /** Person's name: produces the initials and the accessible name. */
  name?: string;
  /** Icon shown when there is no photo or name. @default 'user' */
  iconName?: IconName;
  backgroundColor?: string;
  /** Color of the initials and icon. @default colors.primaryText */
  color?: string;
  /** Custom content; takes precedence over source/name/iconName. */
  children?: React.ReactNode;
  /** @default name */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const styles = StyleSheet.create({
  circle: { justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
});

/** "Ada Lovelace" → "AL", "ada" → "A", "  " → "". Respeta caracteres fuera del BMP. */
export function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '';
  const first = Array.from(words[0] as string)[0] ?? '';
  const last = words.length > 1 ? (Array.from(words[words.length - 1] as string)[0] ?? '') : '';
  return (first + last).toUpperCase();
}

/**
 * Avatar
 * Círculo con foto, iniciales o ícono. Usado a la izquierda de filas de
 * lista o como header de detalle (junto a AvatarHeader).
 *
 * Prioridad: `children` → `source` (si carga) → iniciales de `name` →
 * `iconName` → ícono `user`. Una foto rota no deja un círculo vacío: cae a
 * las iniciales.
 *
 * Gestalt:
 * - Similitud: todos los avatares de una lista comparten forma y tamaño, así
 *   una columna de personas se escanea como una serie aunque mezcle fotos,
 *   iniciales e íconos.
 * - Cierre: el círculo recorta la foto (overflow hidden); las iniciales y el
 *   ícono se escalan con `size` para que el contenido siempre quede dentro.
 *
 * Accesibilidad: con `name` (o `accessibilityLabel`) se anuncia como imagen
 * con ese nombre; sin ninguno es decorativo.
 */
export const Avatar = memo(
  ({
    size = 44,
    source,
    name,
    iconName,
    backgroundColor,
    color,
    children,
    accessibilityLabel,
    style,
    testID,
  }: AvatarProps) => {
    const colors = useColors();
    const theme = useTheme();
    const allowFontScaling = useAllowFontScaling();
    const [failed, setFailed] = useState(false);
    const fg = color ?? colors.primaryText;
    const label = accessibilityLabel ?? name;
    const initials = name ? initialsOf(name) : '';

    let content: React.ReactNode = children;
    if (content == null) {
      if (source && !failed) {
        content = (
          <RNImage
            source={source}
            style={{ width: size, height: size }}
            onError={() => setFailed(true)}
            accessibilityIgnoresInvertColors
          />
        );
      } else if (initials) {
        content = (
          <Text
            allowFontScaling={allowFontScaling}
            numberOfLines={1}
            style={{ color: fg, fontSize: Math.round(size * 0.4), fontWeight: theme.tokens.fontWeight.semibold }}
          >
            {initials}
          </Text>
        );
      } else {
        content = <Icon name={iconName ?? 'user'} size={Math.round(size * 0.5)} color={fg} />;
      }
    }

    return (
      <View
        testID={testID}
        accessible={!!label}
        accessibilityRole={label ? 'image' : undefined}
        accessibilityLabel={label}
        style={[
          styles.circle,
          { width: size, height: size, borderRadius: size / 2, backgroundColor: backgroundColor || colors.primarySoft },
          style,
        ]}
      >
        {content}
      </View>
    );
  }
);
Avatar.displayName = 'Avatar';
