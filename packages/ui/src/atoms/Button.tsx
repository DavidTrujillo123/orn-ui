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
  // El label sigue ocupando su lugar (invisible) mientras carga: el botón no
  // cambia de ancho y el spinner se centra encima.
  hidden: { opacity: 0 },
  spinner: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, alignItems: 'center', justifyContent: 'center' },
}));

/**
 * Área táctil extra para los tamaños que quedan por debajo de 44pt de alto
 * (Fitts): `sm` mide ~30pt y `link` ~27pt. hitSlop agranda la zona que recibe
 * el toque sin cambiar cómo se ve.
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
 * `transform` (Animated.spring, useNativeDriver) — nunca opacity ni layout —
 * y se omite con Reduce Motion activo.
 *
 * Gestalt:
 * - Punto focal (Von Restorff): `primary` es el único relleno con el acento y
 *   sombra; debe haber uno por pantalla o grupo. El resto de variantes baja
 *   el peso visual en escalones (secondary → outline → ghost → link).
 * - Similitud: todas las variantes comparten forma, radio y tipografía, así
 *   que una fila de botones se lee como un solo grupo de acciones; solo cambia
 *   lo que comunica la jerarquía (relleno, borde, color).
 * - Proximidad: ícono y label van a `spacing.sm`, mucho menos que el padding,
 *   así que se leen como una sola etiqueta.
 *
 * Fitts: `sm` y `link` miden menos de 44pt de alto y compensan con `hitSlop`.
 * Mientras `loading`, el label queda invisible pero ocupa su lugar: el botón no
 * cambia de ancho (sin saltos de layout).
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
      // Disabled ya se marca con sus colores (resolveColors); bajar además la
      // opacidad lo dejaba casi invisible (figura y fondo). Solo `loading`
      // atenúa, para indicar que el botón está ocupado.
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
