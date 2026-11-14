import React, { memo } from 'react';
import { Pressable, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { createStyles } from '../theme/createStyles';
import { useAllowFontScaling, useColors, useLabels } from '../theme/UIProvider';
import { Transition } from '../atoms/Transition';
import { Icon } from '../icons/Icon';
import type { IconName } from '../icons/types';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface ToastProps {
  /** Main line. */
  title: string;
  /** Optional second line. */
  message?: string;
  /** Sets the icon and the color of the side bar. @default 'info' */
  variant?: ToastVariant;
  /** Fires when the toast is tapped (in addition to closing it). */
  onPress?: () => void;
  /** Shows the close X (unless `hideCloseButton`) and is called when it is pressed. */
  onDismiss?: () => void;
  /** Hides the close X. The toast still auto-dismisses by timeout. */
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

/** Width of the colored bar on the left edge. */
const ACCENT_WIDTH = 4;
const ICON_SIZE = 22;
const CLOSE_ICON_SIZE = 18;
/** Pads the close glyph out to a 44pt target without growing the toast. */
const CLOSE_HIT_SLOP = (44 - CLOSE_ICON_SIZE) / 2;
/** How far it drops in from above. */
const ENTER_DISTANCE = 16;

const useStyles = createStyles((theme) => ({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.tokens.spacing.md,
    backgroundColor: theme.colors.surfaceRaised,
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
    width: ACCENT_WIDTH,
    borderTopLeftRadius: theme.tokens.radius.lg,
    borderBottomLeftRadius: theme.tokens.radius.lg,
  },
  text: { flex: 1, gap: theme.tokens.spacing.xxs },
  title: {
    fontSize: theme.tokens.fontSize.md,
    fontWeight: theme.tokens.fontWeight.semibold,
    color: theme.colors.text,
  },
  message: { fontSize: theme.tokens.fontSize.sm, color: theme.colors.textLight, lineHeight: theme.tokens.lineHeight.sm },
}));

/**
 * Toast
 * Ephemeral notification. Normally not used directly: `ToastProvider` +
 * `useToast()` mount and dismiss it for you. It is exposed anyway in case
 * you want to place it yourself inside a specific screen.
 *
 * Design:
 * - Doherty threshold: immediate feedback for an action, without blocking
 *   the screen; it leaves on its own.
 * - Similarity: the variant sets both the bar and the icon color, so success,
 *   error, warning and info read at a glance (and not by color alone: each
 *   has its own glyph).
 * - Figure/ground: a raised surface with a shadow, above the content.
 * - Fitts's law: the close button is a 44pt target.
 * - Screen readers: `ToastProvider` announces each toast as it appears; a
 *   pressable toast reads title and message, and offers "Close" as an action.
 */
export const Toast = memo(
  ({ title, message, variant = 'info', onPress, onDismiss, hideCloseButton, style, testID }: ToastProps) => {
    const colors = useColors();
    const styles = useStyles();
    const allowFontScaling = useAllowFontScaling();
    const labels = useLabels();

    // The side bar is a fill (full accent); the icon is content over the
    // toast's surface and needs the `*Text` role.
    const barColor: Record<ToastVariant, string> = {
      success: colors.success,
      error: colors.error,
      warning: colors.warning,
      info: colors.secondary,
    };
    const iconColor: Record<ToastVariant, string> = {
      success: colors.successText,
      error: colors.errorText,
      warning: colors.warningText,
      info: colors.secondaryText,
    };

    const body = (
      <View style={[styles.container, style]} testID={testID} accessibilityRole="alert">
        <View style={[styles.accent, { backgroundColor: barColor[variant] }]} />
        <Icon name={ICON_BY_VARIANT[variant]} size={ICON_SIZE} color={iconColor[variant]} />
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
          <Pressable onPress={onDismiss} accessibilityRole="button" accessibilityLabel={labels.close} hitSlop={CLOSE_HIT_SLOP}>
            <Icon name="close" size={CLOSE_ICON_SIZE} color={colors.textLight} />
          </Pressable>
        )}
      </View>
    );

    if (!onPress) return body;

    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={message ? `${title}, ${message}` : title}
        // The close X inside a pressable toast isn't reachable on its own:
        // the reader gets it as an action of the toast.
        accessibilityActions={!hideCloseButton && onDismiss ? [{ name: 'dismiss', label: labels.close }] : undefined}
        onAccessibilityAction={(event) => {
          if (event.nativeEvent.actionName === 'dismiss') onDismiss?.();
        }}
      >
        {body}
      </Pressable>
    );
  }
);
Toast.displayName = 'Toast';

/** Wraps a Toast with its enter/exit animation. Internal use by the provider. */
export const AnimatedToast = memo(
  ({ children, onHeight }: { children: React.ReactNode; onHeight?: (h: number) => void }) => (
    <Transition preset={['fade', 'slide-down']} distance={ENTER_DISTANCE} spring>
      <View onLayout={(e) => onHeight?.(e.nativeEvent.layout.height)}>{children}</View>
    </Transition>
  )
);
AnimatedToast.displayName = 'AnimatedToast';
