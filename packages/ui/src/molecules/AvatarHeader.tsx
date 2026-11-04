import React, { memo } from 'react';
import { Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { createStyles } from '../theme/createStyles';
import { useAllowFontScaling, useColors } from '../theme/UIProvider';
import { Icon } from '../icons/Icon';
import type { IconName } from '../icons/types';

export interface AvatarHeaderProps {
  /** Icon to show inside the circle. If omitted, `initials` is used instead. */
  iconName?: IconName;
  /** Icon color. Keep AA contrast against `primarySoft`, the circle's fill. @default colors.primary */
  iconColor?: string;
  /** Short text (e.g. 2 letters) shown when `iconName` isn't provided. Without either, a `user` icon. */
  initials?: string;
  /** Main heading of the screen or modal; announced as a header. */
  title: string;
  /** Supporting line under the title. A string gets the muted style; a node renders as is. */
  subtitle?: React.ReactNode;
  /**
   * Third and last line, the least important detail ("Joined March 2023").
   * Three lines is the limit: beyond that the header stops being scannable.
   */
  caption?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const CIRCLE = 80;
const ICON_SIZE = 40;

const useStyles = createStyles((theme) => ({
  // No outer margin: the space below belongs to the parent's layout.
  container: { alignItems: 'center' },
  avatar: {
    width: CIRCLE,
    height: CIRCLE,
    borderRadius: CIRCLE / 2,
    backgroundColor: theme.colors.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.tokens.spacing.md,
  },
  initials: {
    fontSize: theme.tokens.fontSize.xxl,
    fontWeight: theme.tokens.fontWeight.bold,
    color: theme.colors.primaryText,
  },
  title: {
    fontSize: theme.tokens.fontSize.xl,
    lineHeight: theme.tokens.lineHeight.lg,
    fontWeight: theme.tokens.fontWeight.bold,
    textAlign: 'center',
    color: theme.colors.text,
    marginBottom: theme.tokens.spacing.xs,
  },
  subtitle: {
    fontSize: theme.tokens.fontSize.md,
    lineHeight: theme.tokens.lineHeight.md,
    color: theme.colors.textLight,
    textAlign: 'center',
  },
  caption: {
    fontSize: theme.tokens.fontSize.sm,
    lineHeight: theme.tokens.lineHeight.sm,
    color: theme.colors.textLight,
    textAlign: 'center',
    marginTop: theme.tokens.spacing.xxs,
  },
}));

/**
 * AvatarHeader
 * 80x80 circle with an icon or initials + centered title/subtitle. Typical
 * header of detail modals (client, product, etc).
 *
 * Gestalt, symmetry and focal point: everything sits on one centered axis and
 * the circle is the single large shape, so the eye lands there first and then
 * drops to the title. Proximity: title and subtitle are closer to each other
 * than to the circle, reading as one name + its detail. Hierarchy by size:
 * title, subtitle, caption — at most three lines of text. Long text wraps
 * centered, so the axis holds. No outer margin: the parent sets the spacing.
 *
 * Accessibility: the title is a header; the circle is decorative (the
 * initials would only repeat the title).
 */
export const AvatarHeader = memo(
  ({ iconName, iconColor, initials, title, subtitle, caption, style, testID }: AvatarHeaderProps) => {
    const colors = useColors();
    const styles = useStyles();
    const allowFontScaling = useAllowFontScaling();
    const fallbackIcon: IconName | undefined = iconName ?? (initials ? undefined : 'user');

    return (
      <View style={[styles.container, style]} testID={testID}>
        <View style={styles.avatar} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          {fallbackIcon ? (
            <Icon name={fallbackIcon} size={ICON_SIZE} color={iconColor ?? colors.primary} />
          ) : (
            <Text allowFontScaling={allowFontScaling} style={styles.initials}>
              {initials}
            </Text>
          )}
        </View>
        <Text allowFontScaling={allowFontScaling} style={styles.title} accessibilityRole="header">
          {title}
        </Text>
        {typeof subtitle === 'string' ? (
          <Text allowFontScaling={allowFontScaling} style={styles.subtitle}>
            {subtitle}
          </Text>
        ) : (
          subtitle
        )}
        {!!caption && (
          <Text allowFontScaling={allowFontScaling} style={styles.caption}>
            {caption}
          </Text>
        )}
      </View>
    );
  }
);
AvatarHeader.displayName = 'AvatarHeader';
