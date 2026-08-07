import React, { memo, useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  Pressable,
  Text,
  type GestureResponderEvent,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { createStyles } from '../theme/createStyles';
import { useAllowFontScaling, useColors, useTheme } from '../theme/UIProvider';
import { Icon } from '../icons/Icon';
import type { IconName } from '../icons/types';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'link' | 'destructive';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  title: string;
  onPress: (e: GestureResponderEvent) => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  leftIconName?: IconName;
  rightIconName?: IconName;
  iconColor?: string;
  testID?: string;
  accessibilityLabel?: string;
}

const useStyles = createStyles((theme) => ({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.tokens.radius.lg,
    borderWidth: 0,
  },
  sm: { paddingVertical: theme.tokens.spacing.sm, paddingHorizontal: theme.tokens.spacing.md },
  md: { paddingVertical: theme.tokens.spacing.lg - 1, paddingHorizontal: theme.tokens.spacing.xl },
  lg: { paddingVertical: theme.tokens.spacing.lg + 2, paddingHorizontal: theme.tokens.spacing.xxl },
  link: { paddingVertical: theme.tokens.spacing.xs, paddingHorizontal: 0, justifyContent: 'flex-start' },
  outline: { borderWidth: 1 },
  filledShadow: { ...theme.tokens.shadow.md, shadowColor: '#000' },
  text: { fontWeight: theme.tokens.fontWeight.semibold, textAlign: 'center' },
  textSm: { fontSize: theme.tokens.fontSize.sm },
  textMd: { fontSize: theme.tokens.fontSize.lg },
  textLg: { fontSize: theme.tokens.fontSize.xl },
  underline: { textDecorationLine: 'underline' },
  iconLeft: { marginRight: theme.tokens.spacing.sm },
  iconRight: { marginLeft: theme.tokens.spacing.sm },
}));

function resolveColors(variant: ButtonVariant, disabled: boolean, colors: ReturnType<typeof useColors>) {
  if (disabled) {
    return { background: colors.inputBackground, text: colors.textLight, border: 'transparent' };
  }
  switch (variant) {
    // Las variantes sin relleno pintan texto sobre el fondo de la pantalla:
    // van con el rol `*Text`. Las rellenas van con `on*` sobre el acento.
    case 'outline':
      return { background: 'transparent', text: colors.primaryText, border: colors.primary };
    case 'ghost':
      return { background: 'transparent', text: colors.primaryText, border: 'transparent' };
    case 'link':
      return { background: 'transparent', text: colors.primaryText, border: 'transparent' };
    case 'secondary':
      return { background: colors.secondary, text: colors.onSecondary, border: 'transparent' };
    case 'destructive':
      return { background: colors.error, text: colors.onError, border: 'transparent' };
    case 'primary':
    default:
      return { background: colors.primary, text: colors.onPrimary, border: 'transparent' };
  }
}

/**
 * Button
 * Único componente de botón de la librería. `variant` decide el estilo
 * semántico, `size` la densidad. El feedback de "presionado" anima solo
 * `transform` (Animated.spring, useNativeDriver) — nunca opacity ni layout.
 */
export const Button = memo(
  ({
    title,
    onPress,
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled = false,
    style,
    textStyle,
    leftIcon,
    rightIcon,
    leftIconName,
    rightIconName,
    iconColor,
    testID,
    accessibilityLabel,
  }: ButtonProps) => {
    const styles = useStyles();
    const colors = useColors();
    const theme = useTheme();
    const allowFontScaling = useAllowFontScaling();
    const scale = useRef(new Animated.Value(1)).current;
    const isDisabled = disabled || loading;
    const isFilled = variant === 'primary' || variant === 'secondary' || variant === 'destructive';

    const resolved = resolveColors(variant, disabled, colors);
    const effectiveIconColor = iconColor ?? resolved.text;

    const animateTo = (value: number) => {
      Animated.spring(scale, { toValue: value, useNativeDriver: true, speed: 50, bounciness: 6 }).start();
    };

    const containerStyle: StyleProp<ViewStyle> = [
      styles.base,
      styles[size],
      variant === 'link' && styles.link,
      variant === 'outline' && [styles.outline, { borderColor: resolved.border }],
      { backgroundColor: resolved.background },
      isFilled && !disabled && styles.filledShadow,
      { opacity: isDisabled ? 0.7 : 1 },
      style,
    ];

    const labelStyle: StyleProp<TextStyle> = [
      styles.text,
      size === 'sm' ? styles.textSm : size === 'lg' ? styles.textLg : styles.textMd,
      { color: resolved.text },
      variant === 'link' && styles.underline,
      textStyle,
    ];

    const iconSize = size === 'sm' ? 16 : size === 'lg' ? 22 : 20;

    return (
      // El Pressable ES el contenedor animado, no un wrapper alrededor de uno.
      // Con un Animated.View interno, un `style` de layout (flex, width,
      // margin) caía en el hijo mientras el Pressable — que es quien ocupa
      // lugar en el layout del padre — quedaba sin él: el ancho colapsaba y
      // el label desaparecía (visible en los botones en fila del Alert).
      <AnimatedPressable
        onPress={onPress}
        onPressIn={() => {
          if (!isDisabled) animateTo(0.95);
        }}
        onPressOut={() => {
          if (!isDisabled) animateTo(1);
        }}
        disabled={isDisabled}
        testID={testID}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? title}
        accessibilityState={{ disabled: isDisabled, busy: loading }}
        style={[containerStyle, { transform: [{ scale }] }]}
      >
        {loading ? (
          <ActivityIndicator size="small" color={resolved.text} />
        ) : (
          <>
            {leftIcon}
            {!leftIcon && leftIconName && (
              <Icon name={leftIconName} size={iconSize} color={effectiveIconColor} style={styles.iconLeft} />
            )}
            <Text allowFontScaling={allowFontScaling} style={labelStyle}>
              {title}
            </Text>
            {rightIcon}
            {!rightIcon && rightIconName && (
              <Icon name={rightIconName} size={iconSize} color={effectiveIconColor} style={styles.iconRight} />
            )}
          </>
        )}
      </AnimatedPressable>
    );
  }
);
Button.displayName = 'Button';
