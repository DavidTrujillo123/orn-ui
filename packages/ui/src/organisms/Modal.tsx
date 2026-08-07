import React, { memo, useEffect, useRef, useState } from 'react';
import {
  Animated,
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

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export type ModalVariant = 'full' | 'overlay' | 'fullScreen' | 'bottomSheet';

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
  bottomSheetContainer: { justifyContent: 'flex-end', padding: 0 },
  backdrop: { backgroundColor: theme.colors.overlay },
  overlayCard: {
    width: '100%',
    maxHeight: '85%',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.tokens.radius.xxl,
    overflow: 'hidden',
    ...theme.tokens.shadow.lg,
  },
  bottomSheetCard: {
    width: '100%',
    maxHeight: '90%',
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.tokens.radius.xxl,
    borderTopRightRadius: theme.tokens.radius.xxl,
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
 * teclado, insets y layout según `variant`. overlay/bottomSheet/full animan
 * su entrada/salida con Animated (solo transform, nunca opacity sobre la
 * tarjeta: animar opacity ahí dispara un bug de Android donde los hijos con
 * elevation parpadean/redibujan). El fondo semitransparente sí anima opacity.
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
    const isBottomSheet = variant === 'bottomSheet';
    const isAnimatedVariant = isOverlay || isBottomSheet || isFull;
    const insets = useInsets();
    const colors = useColors();
    const styles = useStyles();

    const [mounted, setMounted] = useState(!isAnimatedVariant && visible);
    const backdropOpacity = useRef(new Animated.Value(0)).current;
    const cardProgress = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      if (!isAnimatedVariant) {
        setMounted(visible);
        return;
      }
      if (visible) {
        setMounted(true);
        Animated.timing(backdropOpacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();
        Animated.timing(cardProgress, { toValue: 1, duration: 250, useNativeDriver: true }).start();
      } else {
        Animated.timing(backdropOpacity, { toValue: 0, duration: 180, useNativeDriver: true }).start();
        Animated.timing(cardProgress, { toValue: 0, duration: 200, useNativeDriver: true }).start(({ finished }) => {
          if (finished) setMounted(false);
        });
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [visible, isAnimatedVariant]);

    const cardAnimatedStyle =
      isBottomSheet || isFull
        ? { transform: [{ translateY: cardProgress.interpolate({ inputRange: [0, 1], outputRange: [SCREEN_HEIGHT, 0] }) }] }
        : {
            transform: [
              { translateY: cardProgress.interpolate({ inputRange: [0, 1], outputRange: [-40, 0] }) },
              { scale: cardProgress.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) },
            ],
          };

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
        transparent={isOverlay || isBottomSheet || isFull}
        statusBarTranslucent={statusBarTranslucent}
        hardwareAccelerated={hardwareAccelerated}
      >
        <KeyboardAvoidingView behavior={behavior} keyboardVerticalOffset={keyboardOffset} style={styles.flex1}>
          {isOverlay || isBottomSheet ? (
            <View style={[styles.overlayContainer, isBottomSheet && styles.bottomSheetContainer]}>
              {/* Sin accessibilityLabel propio: el header ya expone un botón "Close"
                  accesible; duplicar el label aquí generaría dos elementos con el
                  mismo nombre para lectores de pantalla. Tocar afuera es un atajo
                  puramente táctil. */}
              <Animated.View style={[{ ...StyleSheetAbsoluteFill }, styles.backdrop, { opacity: backdropOpacity }]}>
                <Pressable style={StyleSheetAbsoluteFill} onPress={onClose} testID="modal-backdrop" />
              </Animated.View>

              <Animated.View
                style={[
                  isOverlay ? styles.overlayCard : styles.bottomSheetCard,
                  isBottomSheet && { paddingBottom: Math.max(insets.bottom, Platform.OS === 'ios' ? 20 : 0) },
                  containerStyle,
                  cardAnimatedStyle,
                ]}
              >
                {renderHeader()}
                {renderMainContent()}
                {renderFooter()}
              </Animated.View>
            </View>
          ) : (
            <Animated.View style={[styles.fullWrapper, containerStyle, isFull && cardAnimatedStyle]}>
              <View style={[styles.flex1, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
                {renderHeader()}
                {renderMainContent()}
                {renderFooter()}
              </View>
            </Animated.View>
          )}
        </KeyboardAvoidingView>
      </RNModal>
    );
  }
);
Modal.displayName = 'Modal';

const StyleSheetAbsoluteFill: ViewStyle = { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 };
