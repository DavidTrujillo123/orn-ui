import React, { memo, useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  View,
  useWindowDimensions,
  type ModalProps as RNModalProps,
  type ViewStyle,
} from 'react-native';
import { createStyles } from '../theme/createStyles';
import { useLabels, useModalSafeAreaBoundary, useTheme } from '../theme/UIProvider';
import { NativeOverlay } from '../theme/NativeOverlay';
import { KeyboardHandled } from '../theme/KeyboardAvoidance';
import type { EdgeInsets } from '../theme/insets';
import { Title } from '../atoms/Text';
import { IconButton } from '../atoms/IconButton';
import { Transition, type TransitionPreset } from '../atoms/Transition';

export type ModalVariant = 'full' | 'overlay' | 'fullScreen';

export interface ModalProps
  extends Pick<RNModalProps, 'statusBarTranslucent' | 'onRequestClose' | 'hardwareAccelerated'> {
  /** Shows or hides the modal. The animated variants play their exit before unmounting. */
  visible: boolean;
  /**
   * Shows the close button in the header and is called by it, by a tap on the backdrop (`overlay`) and
   * by Android's back button.
   */
  onClose?: () => void;
  /** Header title, on a single line. */
  title?: string;
  /** Accessible name of the close button. @default labels.close */
  closeAccessibilityLabel?: string;
  /** Body of the modal. */
  children: React.ReactNode;
  /** Fixed area below the content (e.g. actions); it doesn't scroll. */
  footer?: React.ReactNode;
  /** Style of the card (`overlay`) or the full-screen wrapper. */
  containerStyle?: ViewStyle;
  /** Style of the content area (the scroll container when `scrollable`). */
  contentStyle?: ViewStyle;
  /**
   * 'full' slides up a full page, 'overlay' a centered card over a dimmed backdrop, 'fullScreen' uses
   * the native full-screen presentation. @default 'full'
   */
  variant?: ModalVariant;
  /** Wraps the content in a ScrollView. @default true */
  scrollable?: boolean;
}

const useStyles = createStyles((theme) => ({
  flex1: { flex: 1 },
  fullWrapper: { flex: 1, backgroundColor: theme.colors.surface },
  overlayContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: theme.tokens.spacing.xl },
  backdrop: { backgroundColor: theme.colors.overlay },
  overlayCard: {
    width: '100%',
    maxHeight: '85%',
    // Raised: in dark mode the plain surface sank into the dimmed backdrop.
    backgroundColor: theme.colors.surfaceRaised,
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
  },
  title: { fontSize: theme.tokens.fontSize.xl, fontWeight: theme.tokens.fontWeight.bold, flex: 1 },
  closeButton: { marginLeft: theme.tokens.spacing.md },
  cardInner: { flexShrink: 1 },
  contentWrapper: { flexShrink: 1 },
  scrollWrapper: { flexShrink: 1 },
  scrollContent: { padding: theme.tokens.spacing.xl, flexGrow: 1 },
  scrollContentFull: { padding: 0, flexGrow: 1 },
  footer: {
    padding: theme.tokens.spacing.xl,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
}));

/** Close glyph: the same size BottomSheet uses; IconButton pads it to 44pt. */
const CLOSE_ICON_SIZE = 24;
/** How far the `overlay` card drops in while it scales up. */
const OVERLAY_ENTER_DISTANCE = 40;


/**
 * Modal
 * A single component for all of the app's modals: handles scroll, keyboard,
 * insets and layout according to `variant`. For a sheet from the bottom there
 * is BottomSheet, which also comes with drag to close.
 *
 * Design:
 * - Figure and ground (Gestalt): `overlay` dims the screen behind a raised
 *   card, so the task in front is the only figure.
 * - Common region: header, content and footer share one surface, split by
 *   hairlines; the footer stays fixed so its actions are always in reach.
 * - Jakob's law: title on the left, close at the top right, Android back and
 *   the VoiceOver escape gesture close it, like the system's own sheets.
 * - Fitts's law: the close button is a 44pt target.
 * - Screen readers stay inside the modal (`accessibilityViewIsModal`), which
 *   matters on iOS when it is drawn inside another open overlay.
 */
export const Modal = memo(
  ({
    visible,
    onClose,
    title,
    closeAccessibilityLabel,
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
    const ModalSafeAreaBoundary = useModalSafeAreaBoundary();
    const theme = useTheme();
    const { colors } = theme;
    const styles = useStyles();
    const labels = useLabels();
    const closeLabel = closeAccessibilityLabel ?? labels.close;
    const { height: windowHeight } = useWindowDimensions();

    const [mounted, setMounted] = useState(!isAnimatedVariant && visible);

    useEffect(() => {
      if (!isAnimatedVariant) setMounted(visible);
      else if (visible) setMounted(true);
    }, [visible, isAnimatedVariant]);

    // The card never animates opacity: doing so triggers an Android bug where
    // children with elevation flicker. The semi-transparent backdrop does.
    const cardPreset: TransitionPreset[] = isFull ? ['slide-up'] : ['slide-down', 'scale'];
    const cardDistance = isFull ? windowHeight : OVERLAY_ENTER_DISTANCE;

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
            <IconButton
              iconName="close"
              size={CLOSE_ICON_SIZE}
              color={colors.text}
              onPress={onClose}
              accessibilityLabel={closeLabel}
              style={styles.closeButton}
            />
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
            nestedScrollEnabled
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

    const renderBody = (insets: EdgeInsets) =>
              isOverlay ? (
                <View style={styles.overlayContainer}>
                  {/* No accessibilityLabel of its own: the header already exposes an
                      accessible "Close" button; duplicating the label here would create
                      two elements with the same name for screen readers. Tapping
                      outside is a purely tactile shortcut. */}
                  <Transition
                    visible={visible}
                    preset="fade"
                    duration={theme.tokens.duration.base}
                    keepMounted
                    style={[{ ...StyleSheetAbsoluteFill }, styles.backdrop]}
                  >
                    <Pressable style={StyleSheetAbsoluteFill} onPress={onClose} testID="modal-backdrop" />
                  </Transition>

                  <Transition
                    visible={visible}
                    preset={cardPreset}
                    distance={cardDistance}
                    duration={theme.tokens.duration.slow}
                    onExited={() => setMounted(false)}
                    style={[styles.overlayCard, containerStyle]}
                  >
                    <View style={styles.cardInner} accessibilityViewIsModal onAccessibilityEscape={onClose}>
                      {renderHeader()}
                      {renderMainContent()}
                      {renderFooter()}
                    </View>
                  </Transition>
                </View>
              ) : isFull ? (
                <Transition
                  visible={visible}
                  preset={cardPreset}
                  distance={cardDistance}
                  duration={theme.tokens.duration.slow}
                  onExited={() => setMounted(false)}
                  style={[styles.fullWrapper, containerStyle]}
                >
                  <View
                    style={[styles.flex1, { paddingTop: insets.top, paddingBottom: insets.bottom }]}
                    accessibilityViewIsModal
                    onAccessibilityEscape={onClose}
                  >
                    {renderHeader()}
                    {renderMainContent()}
                    {renderFooter()}
                  </View>
                </Transition>
              ) : (
                <View
                  style={[styles.fullWrapper, containerStyle]}
                >
                  <View
                    style={[styles.flex1, { paddingTop: insets.top, paddingBottom: insets.bottom }]}
                    accessibilityViewIsModal
                    onAccessibilityEscape={onClose}
                  >
                    {renderHeader()}
                    {renderMainContent()}
                    {renderFooter()}
                  </View>
                </View>
              );

    if (!mounted) return null;


    return (
      <NativeOverlay
        // closing: while the exit animation plays, no other overlay layers into it.
        closing={!visible}
        onRequestClose={onRequestClose ?? onClose}
        animationType={isAnimatedVariant ? 'none' : 'slide'}
        // `full` animates its own entrance (translateY) with animationType="none"
        // and needs `transparent` so no black background shows behind it
        // while sliding. RN only allows `transparent` together with
        // 'overFullScreen' — with 'pageSheet' it warns that the combination
        // isn't supported. That's why `full` uses overFullScreen: pageSheet's
        // native presentation would be redundant with our animation anyway.
        presentationStyle={
          Platform.OS === 'ios' ? (isFullScreen ? 'fullScreen' : 'overFullScreen') : undefined
        }
        transparent={isOverlay || isFull}
        statusBarTranslucent={statusBarTranslucent}
        hardwareAccelerated={hardwareAccelerated}
      >
        {/* Its own native window: its KeyboardAvoidingView compensates for it, not the root host. */}
        <KeyboardHandled>
        <KeyboardAvoidingView behavior={behavior} keyboardVerticalOffset={keyboardOffset} style={styles.flex1}>
          {/* Insets measured inside this native Modal window, not the app
              root's — they may differ (Android always opens its own window;
              iOS depending on `presentationStyle`). */}
          <ModalSafeAreaBoundary>{renderBody}</ModalSafeAreaBoundary>
        </KeyboardAvoidingView>
        </KeyboardHandled>
      </NativeOverlay>
    );
  }
);
Modal.displayName = 'Modal';

const StyleSheetAbsoluteFill: ViewStyle = { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 };
