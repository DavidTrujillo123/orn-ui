import React, { memo } from 'react';
import { Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { createStyles } from '../theme/createStyles';
import { useAllowFontScaling, useTheme } from '../theme/UIProvider';

export type BadgeVariant = 'success' | 'error' | 'warning' | 'info' | 'neutral';

export interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  /** Override manual, gana sobre `variant`. */
  backgroundColor?: string;
  textColor?: string;
  style?: StyleProp<ViewStyle>;
}

const useStyles = createStyles((theme) => ({
  badge: {
    paddingHorizontal: theme.tokens.spacing.md - 2,
    paddingVertical: theme.tokens.spacing.xs + 1,
    borderRadius: theme.tokens.radius.full,
    alignSelf: 'flex-start',
  },
  text: { fontSize: theme.tokens.fontSize.xs, fontWeight: theme.tokens.fontWeight.bold, letterSpacing: 0.3 },
}));

/**
 * Badge
 * Pill de estado. `variant` cubre los casos comunes (éxito/error/advertencia/
 * info/neutral); `backgroundColor`/`textColor` quedan para casos que no
 * encajan en el set semántico.
 */
export const Badge = memo(({ label, variant = 'neutral', backgroundColor, textColor, style }: BadgeProps) => {
  const theme = useTheme();
  const styles = useStyles();
  const allowFontScaling = useAllowFontScaling();
  const { colors } = theme;

  const palette: Record<BadgeVariant, { bg: string; fg: string }> = {
    success: { bg: colors.success + '20', fg: colors.success },
    error: { bg: colors.error + '20', fg: colors.error },
    warning: { bg: colors.warning + '20', fg: colors.warning },
    info: { bg: colors.secondary + '20', fg: colors.secondary },
    neutral: { bg: colors.inputBackground, fg: colors.textLight },
  };

  return (
    <View style={[styles.badge, { backgroundColor: backgroundColor ?? palette[variant].bg }, style]}>
      <Text allowFontScaling={allowFontScaling} style={[styles.text, { color: textColor ?? palette[variant].fg }]}>
        {label}
      </Text>
    </View>
  );
});
Badge.displayName = 'Badge';
