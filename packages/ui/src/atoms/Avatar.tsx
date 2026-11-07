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
  /** Fill of the circle. @default colors.primarySoft */
  backgroundColor?: string;
  /** Color of the initials and icon. @default colors.primaryText */
  color?: string;
  /** Custom content; takes precedence over source/name/iconName. */
  children?: React.ReactNode;
  /** Accessible name. Without it (and without `name`) the avatar is decorative. @default name */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const styles = StyleSheet.create({
  circle: { justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
});

/** "Ada Lovelace" → "AL", "ada" → "A", "  " → "". Handles characters outside the BMP. */
export function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '';
  const first = Array.from(words[0] as string)[0] ?? '';
  const last = words.length > 1 ? (Array.from(words[words.length - 1] as string)[0] ?? '') : '';
  return (first + last).toUpperCase();
}

/**
 * Avatar
 * Circle with a photo, initials or an icon. Used on the left of list rows
 * or as a detail header (alongside AvatarHeader).
 *
 * Priority: `children` → `source` (if it loads) → initials of `name` →
 * `iconName` → `user` icon. A broken photo doesn't leave an empty circle: it
 * falls back to the initials.
 *
 * Gestalt:
 * - Similarity: all avatars in a list share shape and size, so a column of
 *   people scans as a series even when it mixes photos, initials and icons.
 * - Closure: the circle clips the photo (overflow hidden); initials and the
 *   icon scale with `size` so the content always stays inside.
 *
 * Accessibility: with `name` (or `accessibilityLabel`) it announces itself as
 * an image with that name; with neither it is decorative.
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
