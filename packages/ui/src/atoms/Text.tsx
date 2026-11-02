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
    lineHeight: theme.tokens.lineHeight.sm,
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
 * Screen or section title: the highest step of the typographic hierarchy.
 *
 * Gestalt, focal point (Von Restorff): it is the only text in its block with
 * size `xxl` and weight `bold`, so it breaks the series of Body/Caption and is
 * the first thing read. That is why there should be only one per block: two
 * Titles together cancel each other out. The `tight` tracking offsets the room
 * the large size opens between letters so the word reads as a single shape
 * (Prägnanz), and `lineHeight.xl` keeps the block compact when the title wraps.
 *
 * Accessibility: it is announced with `accessibilityRole="header"`, so
 * VoiceOver/TalkBack can jump from title to title. It can be overridden by
 * passing a different `accessibilityRole`.
 */
export const Title = makeVariant('title', 'text', 'header');
/**
 * Second step of the hierarchy: heads a group within the screen or
 * accompanies a Title with a short piece of data.
 *
 * Gestalt, similarity: it shares its color with Body but steps up size (`lg`)
 * and weight (`semibold`), so it is perceived as part of the same family and,
 * at the same time, as the label of the block that follows. Proximity: it
 * should sit closer to the content it heads than to the previous block. It is
 * not an accessibility heading: if it marks a navigable section, use Title (or
 * pass `accessibilityRole="header"`).
 * `lineHeight.lg` (1.5×) keeps the text legible when it spans several lines.
 */
export const Subtitle = makeVariant('subtitle', 'text');
/**
 * Running text: the default style for paragraphs, descriptions and values.
 *
 * Gestalt, similarity: all reading content shares size (`md`), regular weight
 * and the `text` color, so it is perceived as a single level and the steps
 * above (Title, Subtitle) and below (Caption) stand out by contrast.
 * `lineHeight.md` (≈1.43×) gives the room between lines to read long
 * paragraphs. If `color` is passed, the color/background pair must meet WCAG
 * AA (4.5:1); the theme colors already guarantee it.
 */
export const Body = makeVariant('body', 'text');
/**
 * Secondary text: hints, metadata, dates, help below a field.
 *
 * Gestalt, figure and ground: size `sm` and color `textLight` bring it one
 * step below Body, so it reads as context and doesn't compete with the
 * content. Proximity: it sits right next to the element it explains.
 * `textLight` meets WCAG AA over `surface` and `background` in light and dark
 * (palettes tests); don't lighten it further. `lineHeight.sm` (≈1.33×) keeps
 * the lines together when the hint spans several.
 */
export const Caption = makeVariant('caption', 'textLight');
