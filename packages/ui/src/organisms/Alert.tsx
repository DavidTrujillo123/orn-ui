import React, { memo } from 'react';
import { Modal, Text, TouchableWithoutFeedback, View } from 'react-native';
import { createStyles } from '../theme/createStyles';
import { useAllowFontScaling, useColors, useLabels } from '../theme/UIProvider';
import { Button, type ButtonVariant } from '../atoms/Button';
import { Icon } from '../icons/Icon';
import type { IconName } from '../icons/types';

export type AlertType = 'success' | 'error' | 'warning' | 'info' | 'question';

export interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'cancel' | 'default' | 'destructive';
  variant?: ButtonVariant;
}

export interface AlertProps {
  visible: boolean;
  title: string;
  message?: string;
  type?: AlertType;
  onClose?: () => void;
  buttons?: AlertButton[];
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  inline?: boolean;
}

const ICON_BY_TYPE: Record<AlertType, IconName> = {
  success: 'check',
  error: 'alert',
  warning: 'warning',
  question: 'question',
  info: 'info',
};

const useStyles = createStyles((theme) => ({
  overlay: { flex: 1, backgroundColor: theme.colors.overlay, justifyContent: 'center', alignItems: 'center', padding: theme.tokens.spacing.xl },
  overlayInline: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999 },
  container: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.tokens.radius.xl,
    padding: theme.tokens.spacing.xl,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    ...theme.tokens.shadow.md,
  },
  iconContainer: { marginBottom: theme.tokens.spacing.lg - 1 },
  title: { fontSize: theme.tokens.fontSize.xl, fontWeight: theme.tokens.fontWeight.bold, color: theme.colors.text, textAlign: 'center', marginBottom: theme.tokens.spacing.md - 2 },
  message: { fontSize: theme.tokens.fontSize.md, color: theme.colors.textLight, textAlign: 'center', marginBottom: theme.tokens.spacing.xl, lineHeight: theme.tokens.lineHeight.md },
  buttonContainer: { flexDirection: 'row', justifyContent: 'center', gap: theme.tokens.spacing.sm + 2, width: '100%' },
  buttonContainerVertical: { flexDirection: 'column' },
  button: { paddingVertical: theme.tokens.spacing.md - 2, paddingHorizontal: theme.tokens.spacing.xl },
  buttonHorizontal: { flex: 1 },
  buttonVertical: { width: '100%' },
}));

/** Deriva la lista de botones a partir de props, sin mutar `buttons` recibido por props. */
function resolveButtons(props: AlertProps, labels: { confirm: string; cancel: string; close: string }): AlertButton[] {
  const { buttons, confirmText, cancelText, onConfirm, onCancel, onClose } = props;
  if (buttons && buttons.length > 0) return buttons;

  if (confirmText || onConfirm) {
    const list: AlertButton[] = [];
    if (cancelText || onCancel) {
      list.push({ text: cancelText || labels.cancel, onPress: onCancel || onClose, variant: 'outline', style: 'cancel' });
    }
    list.push({ text: confirmText || labels.confirm, onPress: onConfirm, variant: 'primary' });
    return list;
  }

  return [{ text: labels.close, onPress: onClose, variant: 'outline' }];
}

/**
 * Alert
 * Componente declarativo de diálogo. Para uso imperativo (mostrar desde
 * un handler sin levantar estado propio), usar AlertProvider + useAlert().
 */
export const Alert = memo((props: AlertProps) => {
  const { visible, title, message, type = 'info', onClose, inline = false } = props;
  const colors = useColors();
  const styles = useStyles();
  const labels = useLabels();
  const allowFontScaling = useAllowFontScaling();

  if (!visible) return null;

  const iconColor: Record<AlertType, string> = {
    success: colors.success,
    error: colors.error,
    warning: colors.warning,
    question: colors.primary,
    info: colors.secondary,
  };

  const effectiveButtons = resolveButtons(props, { confirm: labels.confirm, cancel: labels.cancel, close: labels.close });
  const vertical = effectiveButtons.length > 2;

  const content = (
    <TouchableWithoutFeedback onPress={onClose} accessibilityRole="none">
      <View style={[styles.overlay, inline && styles.overlayInline]}>
        <TouchableWithoutFeedback>
          <View style={styles.container} accessibilityRole="alert" accessibilityViewIsModal>
            <View style={styles.iconContainer}>
              <Icon name={ICON_BY_TYPE[type]} size={48} color={iconColor[type]} />
            </View>

            <Text allowFontScaling={allowFontScaling} style={styles.title}>
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
                    style={[styles.button, vertical ? styles.buttonVertical : styles.buttonHorizontal]}
                    textStyle={{ fontSize: 14 }}
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
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} pointerEvents="box-none">
        {content}
      </View>
    );
  }

  return (
    <Modal transparent visible={visible} animationType="fade" statusBarTranslucent presentationStyle="overFullScreen" onRequestClose={onClose || (() => {})}>
      {content}
    </Modal>
  );
});
Alert.displayName = 'Alert';
