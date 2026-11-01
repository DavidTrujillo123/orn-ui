import React, { memo } from 'react';
import {
  Text as RNText,
  type AccessibilityRole,
  type StyleProp,
  type TextProps,
  type TextStyle,
} from 'react-native';
import { createStyles } from '../theme/createStyles';
import { useAllowFontScaling, useColors } from '../theme/UIProvider';

export interface TypographyProps extends TextProps {
  children?: React.ReactNode;
  style?: StyleProp<TextStyle>;
  color?: string;
  align?: 'left' | 'center' | 'right';
}

const useStyles = createStyles((theme) => ({
  title: {
    fontSize: theme.tokens.fontSize.xxl,
    lineHeight: theme.tokens.lineHeight.xl,
    fontWeight: theme.tokens.fontWeight.bold,
    letterSpacing: theme.tokens.letterSpacing.tight,
    color: theme.colors.text,
  },
  subtitle: {
    fontSize: theme.tokens.fontSize.lg,
    lineHeight: theme.tokens.lineHeight.lg,
    fontWeight: theme.tokens.fontWeight.semibold,
    color: theme.colors.text,
  },
  body: {
    fontSize: theme.tokens.fontSize.md,
    lineHeight: theme.tokens.lineHeight.md,
    color: theme.colors.text,
  },
  caption: {
    fontSize: theme.tokens.fontSize.sm,
    color: theme.colors.textLight,
  },
}));

function makeVariant(
  variant: keyof ReturnType<typeof useStyles>,
  defaultColor: 'text' | 'textLight',
  defaultRole?: AccessibilityRole,
) {
  const Component = memo(({ children, style, color, align = 'left', ...props }: TypographyProps) => {
    const styles = useStyles();
    const colors = useColors();
    const allowFontScaling = useAllowFontScaling();
    return (
      <RNText
        allowFontScaling={allowFontScaling}
        accessibilityRole={defaultRole}
        style={[styles[variant], { color: color || colors[defaultColor], textAlign: align }, style]}
        {...props}
      >
        {children}
      </RNText>
    );
  });
  Component.displayName = variant;
  return Component;
}

/**
 * Título de pantalla o sección: el escalón más alto de la jerarquía tipográfica.
 *
 * Gestalt, punto focal (Von Restorff): es el único texto de su bloque con
 * tamaño `xxl` y peso `bold`, así que rompe la serie de Body/Caption y es lo
 * primero que se lee. Por eso debe haber uno solo por bloque: dos Title juntos
 * se anulan entre sí. El tracking `tight` compensa el aire que el tamaño grande
 * abre entre letras para que la palabra se lea como una sola forma (Prägnanz),
 * y `lineHeight.xl` mantiene ese bloque compacto cuando el título salta de línea.
 *
 * Accesibilidad: se anuncia con `accessibilityRole="header"`, de modo que
 * VoiceOver/TalkBack permiten saltar de título en título. Se puede
 * sobreescribir pasando otro `accessibilityRole`.
 */
export const Title = makeVariant('title', 'text', 'header');
/**
 * Segundo escalón de la jerarquía: encabeza un grupo dentro de la pantalla o
 * acompaña a un Title con un dato breve.
 *
 * Gestalt, similitud: comparte color con Body pero sube tamaño (`lg`) y peso
 * (`semibold`), así que se percibe como de la misma familia y a la vez como el
 * rótulo del bloque que sigue. Proximidad: debe ir más cerca del contenido que
 * encabeza que del bloque anterior. No es un encabezado de accesibilidad: si
 * marca una sección navegable, usar Title (o pasar `accessibilityRole="header"`).
 * `lineHeight.lg` (1.5×) mantiene legible el texto cuando ocupa varias líneas.
 */
export const Subtitle = makeVariant('subtitle', 'text');
/**
 * Texto corrido: el estilo por defecto de párrafos, descripciones y valores.
 *
 * Gestalt, similitud: todo el contenido de lectura comparte tamaño (`md`),
 * peso regular y color `text`, así que se percibe como un solo nivel y los
 * escalones de arriba (Title, Subtitle) y de abajo (Caption) destacan por
 * contraste. `lineHeight.md` (≈1.43×) da el aire entre líneas para leer
 * párrafos largos. Si se pasa `color`, el par color/fondo debe cumplir WCAG AA
 * (4.5:1); los colores del theme ya lo garantizan.
 */
export const Body = makeVariant('body', 'text');
export const Caption = makeVariant('caption', 'textLight');
