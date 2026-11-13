import React, { memo } from 'react';
import { Text, TouchableWithoutFeedback, View } from 'react-native';
import { NativeOverlay } from '../theme/NativeOverlay';
import { createStyles } from '../theme/createStyles';
import { useAllowFontScaling, useColors, useLabels, useTheme } from '../theme/UIProvider';
import { Button, type ButtonVariant } from '../atoms/Button';
import { Icon } from '../icons/Icon';
import type { IconName } from '../icons/types';

export type AlertType = 'success' | 'error' | 'warning' | 'info' | 'question';

export interface AlertButton {
  /** Button label. */
  text: string;
  /** Called on press; without it the button calls `onClose`. */
  onPress?: () => void;
  /** 'cancel' renders outline, 'destructive' renders in the error color. */
  style?: 'cancel' | 'default' | 'destructive';
  /** Explicit Button variant; wins over `style`. */
  variant?: ButtonVariant;
}

export interface AlertProps {
  /** Shows or hides the dialog. */
  visible: boolean;
  /** Short heading; screen readers announce it as a header. */
  title: string;
  /** Optional explanation under the title. */
  message?: string;
  /** Icon and color of the dialog. @default 'info' */
  type?: AlertType;
  /** Tap on the backdrop, Android back, VoiceOver escape. Without it the backdrop does nothing. */
  onClose?: () => void;
  /** Custom buttons; three or more stack vertically. */
  buttons?: AlertButton[];
  /** Shorthand: label of the confirm button. @default labels.confirm */
  confirmText?: string;
  /** Shorthand: label of the cancel button (shown with `onCancel` or `cancelText`). @default labels.cancel */
  cancelText?: string;
  /** Shorthand: confirm action. */
  onConfirm?: () => void;
  /** Shorthand: cancel action (falls back to `onClose`). */
  onCancel?: () => void;
  /** The confirm button uses the destructive color (delete, discard). @default false */
  destructive?: boolean;
  /** Draws the dialog inside its parent instead of over the screen (docs, previews). @default false */
  inline?: boolean;
}

const ICON_BY_TYPE: Record<AlertType, IconName> = {
  success: 'check',
  error: 'alert',
  warning: 'warning',
  question: 'question',
  info: 'info',
};

/** Readable line length for a short dialog on tablets too. */
const DIALOG_MAX_WIDTH = 340;
const ICON_SIZE = 48;
/** Above any sibling of the inline host. */
const INLINE_Z = 9999;

const useStyles = createStyles((theme) => ({
  overlay: {
    flex: 1,
    backgroundColor: theme.colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.tokens.spacing.xl,
  },
  fill: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  overlayInline: { zIndex: INLINE_Z },
  container: {
    // Raised: in dark mode the plain surface sank into the dimmed backdrop.
    backgroundColor: theme.colors.surfaceRaised,
    borderRadius: theme.tokens.radius.xl,
    padding: theme.tokens.spacing.xl,
    width: '100%',
    maxWidth: DIALOG_MAX_WIDTH,
    alignItems: 'center',
    ...theme.tokens.shadow.md,
  },
  iconContainer: { marginBottom: theme.tokens.spacing.lg },
  title: {
    fontSize: theme.tokens.fontSize.xl,
    lineHeight: theme.tokens.lineHeight.lg,
    fontWeight: theme.tokens.fontWeight.bold,
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.tokens.spacing.sm,
  },
  message: {
    fontSize: theme.tokens.fontSize.md,
    lineHeight: theme.tokens.lineHeight.md,
    color: theme.colors.textLight,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: theme.tokens.spacing.sm,
    width: '100%',
    marginTop: theme.tokens.spacing.xl,
  },
  buttonContainerVertical: { flexDirection: 'column' },
  buttonHorizontal: { flex: 1 },
  buttonVertical: { width: '100%' },
}));

/** Derives the list of buttons from props, without mutating the `buttons` received through props. */
function resolveButtons(props: AlertProps, labels: { confirm: string; cancel: string; close: string }): AlertButton[] {
  const { buttons, confirmText, cancelText, onConfirm, onCancel, onClose, destructive } = props;
  if (buttons && buttons.length > 0) return buttons;

  if (confirmText || onConfirm) {
    const list: AlertButton[] = [];
    if (cancelText || onCancel) {
      list.push({ text: cancelText || labels.cancel, onPress: onCancel || onClose, variant: 'outline', style: 'cancel' });
    }
    list.push({ text: confirmText || labels.confirm, onPress: onConfirm, variant: destructive ? 'destructive' : 'primary' });
    return list;
  }

  return [{ text: labels.close, onPress: onClose, variant: 'outline' }];
}

/**
 * Alert
 * Declarative dialog component. For imperative use (showing it from a
 * handler without lifting your own state), use AlertProvider + useAlert().
 *
 * Gestalt, figure-ground: the overlay dims everything behind, so the dialog
 * is the only figure. Proximity: icon, title and message sit together and the
 * buttons a larger step below, as the answer block. Von Restorff: only the
 * main action is filled (or red when `destructive`); cancel is outline.
 * Hick: two buttons side by side; three or more stack so each reads alone.
 *
 * Accessibility: the title is a header, the dialog is modal for VoiceOver and
 * the escape gesture (two-finger Z) calls `onClose`.
 */
export const Alert = memo((props: AlertProps) => {
  const { visible, title, message, type = 'info', onClose, inline = false } = props;
  const theme = useTheme();
  const colors = useColors();
  const styles = useStyles();
  const labels = useLabels();
  const allowFontScaling = useAllowFontScaling();

  if (!visible) return null;

  const iconColor: Record<AlertType, string> = {
    // Icons over the dialog's surface: `*Text` role, not the full accent.
    success: colors.successText,
    error: colors.errorText,
    warning: colors.warningText,
    question: colors.primaryText,
    info: colors.secondaryText,
  };

  const effectiveButtons = resolveButtons(props, { confirm: labels.confirm, cancel: labels.cancel, close: labels.close });
  const vertical = effectiveButtons.length > 2;

  const content = (
    <TouchableWithoutFeedback onPress={onClose} accessibilityRole="none">
      <View style={[styles.overlay, inline && [styles.fill, styles.overlayInline]]}>
        <TouchableWithoutFeedback>
          <View
            style={styles.container}
            accessibilityRole="alert"
            accessibilityViewIsModal
            onAccessibilityEscape={onClose}
          >
            <View style={styles.iconContainer}>
              <Icon name={ICON_BY_TYPE[type]} size={ICON_SIZE} color={iconColor[type]} />
            </View>

            <Text allowFontScaling={allowFontScaling} style={styles.title} accessibilityRole="header">
              {title}
            </Text>

            {!!message && (
              <Text allowFontScaling={allowFontScaling} style={styles.message}>
                {message}
              </Text>
            )}

            <View style={[styles.buttonContainer, vertical && styles.buttonContainerVertical]}>
              {effectiveButtons.map((btn, index) => {
                const isCancel = btn.style === 'cancel';
                let variant: ButtonVariant = btn.variant || 'primary';
                if (!btn.variant && isCancel) variant = 'outline';
                if (!btn.variant && btn.style === 'destructive') variant = 'destructive';

                return (
                  <Button
                    key={index}
                    title={btn.text}
                    onPress={btn.onPress || onClose || (() => {})}
                    variant={variant}
                    style={vertical ? styles.buttonVertical : styles.buttonHorizontal}
                    textStyle={{ fontSize: theme.tokens.fontSize.md }}
                  />
                );
              })}
            </View>
          </View>
        </TouchableWithoutFeedback>
      </View>
    </TouchableWithoutFeedback>
  );

  if (inline) {
    return (
      <View style={styles.fill} pointerEvents="box-none">
        {content}
      </View>
    );
  }

  return (
    <NativeOverlay
      dialog
      transparent
      animationType="fade"
      statusBarTranslucent
      presentationStyle="overFullScreen"
      onRequestClose={onClose || (() => {})}
    >
      {content}
    </NativeOverlay>
  );
});
Alert.displayName = 'Alert';
