import React, { memo } from 'react';
import { Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { createStyles } from '../theme/createStyles';
import { useAllowFontScaling, useTheme } from '../theme/UIProvider';

export type BadgeVariant = 'success' | 'error' | 'warning' | 'info' | 'neutral';

export interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  /** Manual override, takes precedence over `variant`. */
  backgroundColor?: string;
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
 * Pill de estado. `variant` cubre los casos comunes (éxito/error/advertencia/
 * info/neutral); `backgroundColor`/`textColor` quedan para casos que no
 * encajan en el set semántico.
 *
 * Gestalt, similitud: todos los badges comparten forma, tamaño y tipografía;
 * solo el color cambia, y cambia por significado (verde = ok, rojo = error…),
 * así una columna de estados se escanea de un vistazo. El significado también
 * va en el texto: nunca depender solo del color (daltonismo).
 * Cada par `*Soft`/`*Text` del theme cumple WCAG AA en light y dark; con
 * colores propios el contraste queda a cargo de quien los pasa.
 * Una sola línea: un label largo se corta con "…" en vez de deformar la pill.
 */
export const Badge = memo(({ label, variant = 'neutral', backgroundColor, textColor, style }: BadgeProps) => {
  const theme = useTheme();
  const styles = useStyles();
  const allowFontScaling = useAllowFontScaling();
  const { colors } = theme;

  const palette: Record<BadgeVariant, { bg: string; fg: string }> = {
    // fg es el rol `*Text`, no el acento pleno: el acento sobre su propio
    // tinte da ~2.2:1 en light — el label quedaba ilegible.
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
