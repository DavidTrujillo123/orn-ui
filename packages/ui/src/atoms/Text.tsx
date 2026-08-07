import React, { memo } from 'react';
import { Text as RNText, type StyleProp, type TextProps, type TextStyle } from 'react-native';
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
    fontWeight: theme.tokens.fontWeight.bold,
    letterSpacing: -0.5,
    color: theme.colors.text,
  },
  subtitle: {
    fontSize: theme.tokens.fontSize.lg,
    fontWeight: theme.tokens.fontWeight.medium,
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

function makeVariant(variant: keyof ReturnType<typeof useStyles>, defaultColor: 'text' | 'textLight') {
  const Component = memo(({ children, style, color, align = 'left', ...props }: TypographyProps) => {
    const styles = useStyles();
    const colors = useColors();
    const allowFontScaling = useAllowFontScaling();
    return (
      <RNText
        allowFontScaling={allowFontScaling}
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

export const Title = makeVariant('title', 'text');
export const Subtitle = makeVariant('subtitle', 'text');
export const Body = makeVariant('body', 'text');
export const Caption = makeVariant('caption', 'textLight');
