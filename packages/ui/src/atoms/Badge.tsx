import React, { memo } from 'react';
import { Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { createStyles } from '../theme/createStyles';
import { useAllowFontScaling, useTheme } from '../theme/UIProvider';

export type BadgeVariant = 'success' | 'error' | 'warning' | 'info' | 'neutral';

export interface BadgeProps {
  /** Text of the pill, on a single line (truncated with "…"). */
  label: string;
  /** Semantic color set: success, error, warning, info or neutral. @default 'neutral' */
  variant?: BadgeVariant;
  /** Manual override, takes precedence over `variant`. */
  backgroundColor?: string;
  /** Manual text color, takes precedence over `variant`. */
  textColor?: string;
  style?: StyleProp<ViewStyle>;
}

const useStyles = createStyles((theme) => ({
  badge: {
    paddingHorizontal: theme.tokens.spacing.md,
    paddingVertical: theme.tokens.spacing.xs,
    borderRadius: theme.tokens.radius.full,
    alignSelf: 'flex-start',
  },
  text: { fontSize: theme.tokens.fontSize.xs, fontWeight: theme.tokens.fontWeight.bold, letterSpacing: theme.tokens.letterSpacing.wide },
}));

/**
 * Badge
 * Status pill. `variant` covers the common cases (success/error/warning/
 * info/neutral); `backgroundColor`/`textColor` are for cases that don't
 * fit the semantic set.
 *
 * Gestalt, similarity: all badges share shape, size and typography; only
 * the color changes, and it changes by meaning (green = ok, red = error…),
 * so a column of statuses scans at a glance. The meaning also goes in the
 * text: never rely on color alone (color blindness).
 * Every `*Soft`/`*Text` pair in the theme meets WCAG AA in light and dark;
 * with custom colors, contrast is up to whoever passes them.
 * A single line: a long label is truncated with "…" instead of deforming the pill.
 */
export const Badge = memo(({ label, variant = 'neutral', backgroundColor, textColor, style }: BadgeProps) => {
  const theme = useTheme();
  const styles = useStyles();
  const allowFontScaling = useAllowFontScaling();
  const { colors } = theme;

  const palette: Record<BadgeVariant, { bg: string; fg: string }> = {
    // fg is the `*Text` role, not the full accent: the accent over its own
    // tint gives ~2.2:1 in light — the label was unreadable.
    success: { bg: colors.successSoft, fg: colors.successText },
    error: { bg: colors.errorSoft, fg: colors.errorText },
    warning: { bg: colors.warningSoft, fg: colors.warningText },
    info: { bg: colors.secondarySoft, fg: colors.secondaryText },
    neutral: { bg: colors.inputBackground, fg: colors.textLight },
  };

  return (
    <View style={[styles.badge, { backgroundColor: backgroundColor ?? palette[variant].bg }, style]}>
      <Text allowFontScaling={allowFontScaling} numberOfLines={1} style={[styles.text, { color: textColor ?? palette[variant].fg }]}>
        {label}
      </Text>
    </View>
  );
});
Badge.displayName = 'Badge';
