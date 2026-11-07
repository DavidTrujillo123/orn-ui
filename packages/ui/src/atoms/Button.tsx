import React, { memo, useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  Pressable,
  Text,
  View,
  type Insets,
  type GestureResponderEvent,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { createStyles } from '../theme/createStyles';
import { useAllowFontScaling, useColors, useTheme } from '../theme/UIProvider';
import { Icon } from '../icons/Icon';
import { useReduceMotion } from './Transition';
import type { IconName } from '../icons/types';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'link' | 'destructive';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  /** Visible label. Also the accessible name unless `accessibilityLabel` is set. */
  title: string;
  /** Called on press. Not called while `disabled` or `loading`. */
  onPress: (e: GestureResponderEvent) => void;
  /**
   * Semantic style: `primary` is the filled focal action; the others step the visual weight down.
   * @default 'primary'
   */
  variant?: ButtonVariant;
  /** Density: padding and font size. `sm` gets extra touch area through `hitSlop`. @default 'md' */
  size?: ButtonSize;
  /** Shows a spinner over the hidden label (the width doesn't change) and blocks presses. @default false */
  loading?: boolean;
  /** Paints the disabled colors and ignores presses. @default false */
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  /** Extra style for the label text. */
  textStyle?: StyleProp<TextStyle>;
  /** Custom node to the left of the label. Takes precedence over `leftIconName`. */
  leftIcon?: React.ReactNode;
  /** Custom node to the right of the label. Takes precedence over `rightIconName`. */
  rightIcon?: React.ReactNode;
  /** Icon from the library's set to the left of the label, sized to match `size`. */
  leftIconName?: IconName;
  /** Icon from the library's set to the right of the label, sized to match `size`. */
  rightIconName?: IconName;
  /** Color of `leftIconName`/`rightIconName`. Defaults to the label color of the variant. */
  iconColor?: string;
  testID?: string;
  /** What screen readers announce. @default title */
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
  md: { paddingVertical: theme.tokens.spacing.lg, paddingHorizontal: theme.tokens.spacing.xl },
  lg: { paddingVertical: theme.tokens.spacing.xl, paddingHorizontal: theme.tokens.spacing.xxl },
  link: { paddingVertical: theme.tokens.spacing.xs, paddingHorizontal: 0, justifyContent: 'flex-start' },
  outline: { borderWidth: 1 },
  filledShadow: theme.tokens.shadow.md,
  text: { fontWeight: theme.tokens.fontWeight.semibold, textAlign: 'center' },
  textSm: { fontSize: theme.tokens.fontSize.sm },
  textMd: { fontSize: theme.tokens.fontSize.lg },
  textLg: { fontSize: theme.tokens.fontSize.xl },
  underline: { textDecorationLine: 'underline' },
  iconLeft: { marginRight: theme.tokens.spacing.sm },
  iconRight: { marginLeft: theme.tokens.spacing.sm },
  // The label keeps taking its space (invisible) while loading: the button
  // doesn't change width and the spinner is centered on top.
  hidden: { opacity: 0 },
  spinner: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, alignItems: 'center', justifyContent: 'center' },
}));

/**
 * Extra touch area for the sizes that fall below 44pt in height
 * (Fitts): `sm` measures ~30pt and `link` ~27pt. hitSlop enlarges the area
 * that receives the touch without changing how it looks.
 */
function useHitSlop(size: ButtonSize, variant: ButtonVariant): Insets | undefined {
  const theme = useTheme();
  if (variant === 'link') {
    const v = theme.tokens.spacing.md;
    return { top: v, bottom: v, left: theme.tokens.spacing.sm, right: theme.tokens.spacing.sm };
  }
  if (size === 'sm') {
    const v = theme.tokens.spacing.sm;
    return { top: v, bottom: v };
  }
  return undefined;
}

function resolveColors(variant: ButtonVariant, disabled: boolean, colors: ReturnType<typeof useColors>) {
  if (disabled) {
    return { background: colors.inputBackground, text: colors.textLight, border: 'transparent' };
  }
  switch (variant) {
    // The unfilled variants paint text over the screen background: they
    // use the `*Text` role. The filled ones use `on*` over the accent.
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
 * The library's only button component. `variant` sets the semantic style,
 * `size` the density. The "pressed" feedback animates only `transform`
 * (Animated.spring, useNativeDriver) — never opacity or layout — and is
 * skipped when Reduce Motion is on.
 *
 * Gestalt:
 * - Focal point (Von Restorff): `primary` is the only one filled with the
 *   accent and a shadow; there should be one per screen or group. The other
 *   variants step the visual weight down (secondary → outline → ghost → link).
 * - Similarity: all variants share shape, radius and typography, so a row of
 *   buttons reads as a single group of actions; only what conveys the
 *   hierarchy changes (fill, border, color).
 * - Proximity: icon and label sit `spacing.sm` apart, much less than the
 *   padding, so they read as a single label.
 *
 * Fitts: `sm` and `link` are less than 44pt tall and make up for it with `hitSlop`.
 * While `loading`, the label is invisible but keeps its space: the button
 * doesn't change width (no layout jumps).
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
    const reduceMotion = useReduceMotion();
    const hitSlop = useHitSlop(size, variant);
    const isDisabled = disabled || loading;
    const isFilled = variant === 'primary' || variant === 'secondary' || variant === 'destructive';

    const resolved = resolveColors(variant, disabled, colors);
    const effectiveIconColor = iconColor ?? resolved.text;

    const animateTo = (value: number) => {
      if (reduceMotion) return;
      Animated.spring(scale, { toValue: value, useNativeDriver: true, speed: 50, bounciness: 6 }).start();
    };

    const containerStyle: StyleProp<ViewStyle> = [
      styles.base,
      styles[size],
      variant === 'link' && styles.link,
      variant === 'outline' && [styles.outline, { borderColor: resolved.border }],
      { backgroundColor: resolved.background },
      isFilled && !disabled && styles.filledShadow,
      // Disabled is already marked by its colors (resolveColors); lowering the
      // opacity on top of that left it almost invisible (figure and ground).
      // Only `loading` dims it, to signal that the button is busy.
      { opacity: loading && !disabled ? 0.7 : 1 },
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
      // The Pressable IS the animated container, not a wrapper around one.
      // With an inner Animated.View, a layout `style` (flex, width, margin)
      // landed on the child while the Pressable — which is what takes up
      // space in the parent's layout — was left without it: the width
      // collapsed and the label disappeared (visible in the Alert's row of buttons).
      <AnimatedPressable
        onPress={onPress}
        onPressIn={() => {
          if (!isDisabled) animateTo(0.95);
        }}
        onPressOut={() => {
          if (!isDisabled) animateTo(1);
        }}
        disabled={isDisabled}
        hitSlop={hitSlop}
        testID={testID}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? title}
        accessibilityState={{ disabled: isDisabled, busy: loading }}
        style={[containerStyle, { transform: [{ scale }] }]}
      >
        {leftIcon ? <View style={[styles.iconLeft, loading && styles.hidden]}>{leftIcon}</View> : null}
        {!leftIcon && leftIconName && (
          <Icon
            name={leftIconName}
            size={iconSize}
            color={effectiveIconColor}
            style={[styles.iconLeft, loading && styles.hidden]}
          />
        )}
        <Text allowFontScaling={allowFontScaling} style={[labelStyle, loading && styles.hidden]}>
          {title}
        </Text>
        {rightIcon ? <View style={[styles.iconRight, loading && styles.hidden]}>{rightIcon}</View> : null}
        {!rightIcon && rightIconName && (
          <Icon
            name={rightIconName}
            size={iconSize}
            color={effectiveIconColor}
            style={[styles.iconRight, loading && styles.hidden]}
          />
        )}
        {loading && (
          <View style={styles.spinner} pointerEvents="none">
            <ActivityIndicator size="small" color={resolved.text} />
          </View>
        )}
      </AnimatedPressable>
    );
  }
);
Button.displayName = 'Button';
