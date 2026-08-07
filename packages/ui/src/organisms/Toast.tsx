import React, { memo, useEffect, useRef } from 'react';
import { Animated, Pressable, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { createStyles } from '../theme/createStyles';
import { useAllowFontScaling, useColors } from '../theme/UIProvider';
import { Icon } from '../icons/Icon';
import type { IconName } from '../icons/types';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface ToastProps {
  title: string;
  message?: string;
  variant?: ToastVariant;
  /** Se dispara al tocar el toast (además de cerrarlo). */
  onPress?: () => void;
  onDismiss?: () => void;
  /** Oculta la X de cerrar. El toast igual se auto-descarta por tiempo. */
  hideCloseButton?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const ICON_BY_VARIANT: Record<ToastVariant, IconName> = {
  success: 'check',
  error: 'alert',
  warning: 'warning',
  info: 'info',
};

const useStyles = createStyles((theme) => ({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.tokens.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.tokens.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingVertical: theme.tokens.spacing.md,
    paddingHorizontal: theme.tokens.spacing.lg,
    ...theme.tokens.shadow.lg,
  },
  accent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderTopLeftRadius: theme.tokens.radius.lg,
    borderBottomLeftRadius: theme.tokens.radius.lg,
  },
  text: { flex: 1, gap: 2 },
  title: {
    fontSize: theme.tokens.fontSize.md,
    fontWeight: theme.tokens.fontWeight.semibold,
    color: theme.colors.text,
  },
  message: { fontSize: theme.tokens.fontSize.sm, color: theme.colors.textLight, lineHeight: theme.tokens.lineHeight.sm },
}));

/**
 * Toast
 * Notificación efímera. Normalmente no se usa directo: `ToastProvider` +
 * `useToast()` la montan y la descartan por vos. Se expone igual por si
 * querés colocarla vos mismo dentro de una pantalla concreta.
 */
export const Toast = memo(
  ({ title, message, variant = 'info', onPress, onDismiss, hideCloseButton, style, testID }: ToastProps) => {
    const colors = useColors();
    const styles = useStyles();
    const allowFontScaling = useAllowFontScaling();

    const accentColor: Record<ToastVariant, string> = {
      success: colors.success,
      error: colors.error,
      warning: colors.warning,
      info: colors.secondary,
    };

    const body = (
      <View style={[styles.container, style]} testID={testID} accessibilityRole="alert">
        <View style={[styles.accent, { backgroundColor: accentColor[variant] }]} />
        <Icon name={ICON_BY_VARIANT[variant]} size={22} color={accentColor[variant]} />
        <View style={styles.text}>
          <Text allowFontScaling={allowFontScaling} style={styles.title}>
            {title}
          </Text>
          {!!message && (
            <Text allowFontScaling={allowFontScaling} style={styles.message}>
              {message}
            </Text>
          )}
        </View>
        {!hideCloseButton && !!onDismiss && (
          <Pressable onPress={onDismiss} accessibilityRole="button" accessibilityLabel="Dismiss" hitSlop={8}>
            <Icon name="close" size={18} color={colors.textLight} />
          </Pressable>
        )}
      </View>
    );

    if (!onPress) return body;

    return (
      <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={title}>
        {body}
      </Pressable>
    );
  }
);
Toast.displayName = 'Toast';

/** Envuelve un Toast con su animación de entrada/salida. Uso interno del provider. */
export const AnimatedToast = memo(
  ({ children, onHeight }: { children: React.ReactNode; onHeight?: (h: number) => void }) => {
    const progress = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      Animated.spring(progress, { toValue: 1, useNativeDriver: true, speed: 14, bounciness: 4 }).start();
    }, [progress]);

    return (
      <Animated.View
        onLayout={(e) => onHeight?.(e.nativeEvent.layout.height)}
        style={{
          opacity: progress,
          transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [-16, 0] }) }],
        }}
      >
        {children}
      </Animated.View>
    );
  }
);
AnimatedToast.displayName = 'AnimatedToast';
