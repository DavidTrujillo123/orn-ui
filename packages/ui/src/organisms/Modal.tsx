import React, { memo, useEffect, useState } from 'react';
import {
  Dimensions,
  KeyboardAvoidingView,
  Modal as RNModal,
  Platform,
  Pressable,
  ScrollView,
  View,
  type ModalProps as RNModalProps,
  type ViewStyle,
} from 'react-native';
import { createStyles } from '../theme/createStyles';
import { useColors, useInsets } from '../theme/UIProvider';
import { Title } from '../atoms/Text';
import { IconButton } from '../atoms/IconButton';
import { Transition, type TransitionPreset } from '../atoms/Transition';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export type ModalVariant = 'full' | 'overlay' | 'fullScreen';

export interface ModalProps
  extends Pick<RNModalProps, 'statusBarTranslucent' | 'onRequestClose' | 'hardwareAccelerated'> {
  visible: boolean;
  onClose?: () => void;
  title?: string;
  closeAccessibilityLabel?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  containerStyle?: ViewStyle;
  contentStyle?: ViewStyle;
  variant?: ModalVariant;
  scrollable?: boolean;
}

const useStyles = createStyles((theme) => ({
  flex1: { flex: 1 },
  fullWrapper: { flex: 1, backgroundColor: theme.colors.background },
  overlayContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: theme.tokens.spacing.xxl - 4 },
  backdrop: { backgroundColor: theme.colors.overlay },
  overlayCard: {
    width: '100%',
    maxHeight: '85%',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.tokens.radius.xxl,
    overflow: 'hidden',
    ...theme.tokens.shadow.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.tokens.spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  title: { fontSize: theme.tokens.fontSize.xl, fontWeight: theme.tokens.fontWeight.bold, flex: 1 },
  closeButton: { marginLeft: theme.tokens.spacing.md },
  contentWrapper: { flexShrink: 1, backgroundColor: theme.colors.surface },
  scrollWrapper: { flexShrink: 1 },
  scrollContent: { padding: theme.tokens.spacing.xl, flexGrow: 1 },
  scrollContentFull: { padding: 0, flexGrow: 1 },
  footer: {
    padding: theme.tokens.spacing.xl,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
}));

/**
 * Modal
 * Un solo componente para todos los modales de la app: maneja scroll,
 * teclado, insets y layout según `variant`. Para una hoja desde abajo está
 * BottomSheet, que además trae arrastre para cerrar.
 */
export const Modal = memo(
  ({
    visible,
    onClose,
    title,
    closeAccessibilityLabel = 'Close',
    children,
    footer,
    containerStyle,
    contentStyle,
    variant = 'full',
    scrollable = true,
    statusBarTranslucent = true,
    onRequestClose,
    hardwareAccelerated,
  }: ModalProps) => {
    const isFull = variant === 'full';
    const isOverlay = variant === 'overlay';
    const isFullScreen = variant === 'fullScreen';
    const isAnimatedVariant = isOverlay || isFull;
    const insets = useInsets();
    const colors = useColors();
    const styles = useStyles();

    const [mounted, setMounted] = useState(!isAnimatedVariant && visible);

    useEffect(() => {
      if (!isAnimatedVariant) setMounted(visible);
      else if (visible) setMounted(true);
    }, [visible, isAnimatedVariant]);

    // La tarjeta nunca anima opacity: hacerlo dispara un bug de Android donde
    // los hijos con elevation parpadean. El fondo semitransparente sí.
    const cardPreset: TransitionPreset[] = isFull ? ['slide-up'] : ['slide-down', 'scale'];
    const cardDistance = isFull ? SCREEN_HEIGHT : 40;

    const behavior = Platform.OS === 'ios' ? (isFull ? undefined : 'padding') : 'height';
    const keyboardOffset = Platform.OS === 'ios' ? 0 : 20;

    const renderHeader = () => {
      if (!title && !onClose) return null;
      return (
        <View style={styles.header}>
          {!!title && (
            <Title style={styles.title} numberOfLines={1}>
              {title}
            </Title>
          )}
          {!title && <View style={styles.flex1} />}
          {!!onClose && (
            <IconButton iconName="close" size={24} color={colors.text} onPress={onClose} accessibilityLabel={closeAccessibilityLabel} style={styles.closeButton} />
          )}
        </View>
      );
    };

    const renderMainContent = () => (
      <View style={[styles.contentWrapper, isFull && styles.flex1]}>
        {scrollable ? (
          <ScrollView
            style={[styles.scrollWrapper, isFull && styles.flex1]}
            contentContainerStyle={[!isFull ? styles.scrollContent : styles.scrollContentFull, contentStyle]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bounces={Platform.OS === 'ios'}
            automaticallyAdjustKeyboardInsets
          >
            {children}
          </ScrollView>
        ) : (
          <View style={[!isFull ? styles.scrollContent : styles.scrollContentFull, isFull && styles.flex1, contentStyle]}>
            {children}
          </View>
        )}
      </View>
    );

    const renderFooter = () => (footer ? <View style={styles.footer}>{footer}</View> : null);

    if (!mounted) return null;

    return (
      <RNModal
        visible
        onRequestClose={onRequestClose ?? onClose}
        animationType={isAnimatedVariant ? 'none' : 'slide'}
        // `full` anima su propia entrada (translateY) con animationType="none"
        // y necesita `transparent` para que no se vea un fondo negro detrás
        // mientras desliza. RN sólo admite `transparent` junto a
        // 'overFullScreen' — con 'pageSheet' avisa que la combinación no está
        // soportada. Por eso `full` usa overFullScreen: la presentación nativa
        // de pageSheet sería redundante con nuestra animación de todos modos.
        presentationStyle={
          Platform.OS === 'ios' ? (isFullScreen ? 'fullScreen' : 'overFullScreen') : undefined
        }
        transparent={isOverlay || isFull}
        statusBarTranslucent={statusBarTranslucent}
        hardwareAccelerated={hardwareAccelerated}
      >
        <KeyboardAvoidingView behavior={behavior} keyboardVerticalOffset={keyboardOffset} style={styles.flex1}>
          {isOverlay ? (
            <View style={styles.overlayContainer}>
              {/* Sin accessibilityLabel propio: el header ya expone un botón "Close"
                  accesible; duplicar el label aquí generaría dos elementos con el
                  mismo nombre para lectores de pantalla. Tocar afuera es un atajo
                  puramente táctil. */}
              <Transition
                visible={visible}
                preset="fade"
                duration={200}
                keepMounted
                style={[{ ...StyleSheetAbsoluteFill }, styles.backdrop]}
              >
                <Pressable style={StyleSheetAbsoluteFill} onPress={onClose} testID="modal-backdrop" />
              </Transition>

              <Transition
                visible={visible}
                preset={cardPreset}
                distance={cardDistance}
                duration={250}
                onExited={() => setMounted(false)}
                style={[styles.overlayCard, containerStyle]}
              >
                {renderHeader()}
                {renderMainContent()}
                {renderFooter()}
              </Transition>
            </View>
          ) : isFull ? (
            <Transition
              visible={visible}
              preset={cardPreset}
              distance={cardDistance}
              duration={250}
              onExited={() => setMounted(false)}
              style={[styles.fullWrapper, containerStyle]}
            >
              <View style={[styles.flex1, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
                {renderHeader()}
                {renderMainContent()}
                {renderFooter()}
              </View>
            </Transition>
          ) : (
            <View style={[styles.fullWrapper, containerStyle]}>
              <View style={[styles.flex1, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
                {renderHeader()}
                {renderMainContent()}
                {renderFooter()}
              </View>
            </View>
          )}
        </KeyboardAvoidingView>
      </RNModal>
    );
  }
);
Modal.displayName = 'Modal';

const StyleSheetAbsoluteFill: ViewStyle = { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 };
