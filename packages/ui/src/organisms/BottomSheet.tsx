import React, { memo, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  View,
  type ViewStyle,
} from 'react-native';
import { createStyles } from '../theme/createStyles';
import { useColors, useModalSafeAreaBoundary } from '../theme/UIProvider';
import { KeyboardHandled } from '../theme/KeyboardAvoidance';
import { Title } from '../atoms/Text';
import { IconButton } from '../atoms/IconButton';
import { Transition } from '../atoms/Transition';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const DISMISS_THRESHOLD = 100;

export type FooterPlacement = 'fixed' | 'scroll' | 'hide-with-keyboard';

export interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** With a title, the header appears, with its close button. */
  title?: string;
  /** Sheet actions. Where they live is decided by `footerPlacement`. */
  footer?: React.ReactNode;
  /**
   * 'fixed' anchors it to the bottom of the sheet; 'scroll' leaves it at the
   * end of the content; 'hide-with-keyboard' hides it while typing, which in a
   * long form gives that strip back to the focused field. @default 'fixed'
   */
  footerPlacement?: FooterPlacement;
  /** The content scrolls when it doesn't fit. @default true */
  scrollable?: boolean;
  /** Dragging the sheet down closes it. @default true */
  draggable?: boolean;
  /** Fraction of the screen (0-1) or pixels. @default 0.9 */
  maxHeight?: number;
  closeAccessibilityLabel?: string;
  containerStyle?: ViewStyle;
  contentStyle?: ViewStyle;
  testID?: string;
}

const useStyles = createStyles((theme) => ({
  container: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { backgroundColor: theme.colors.overlay },
  sheet: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.tokens.radius.xxl,
    borderTopRightRadius: theme.tokens.radius.xxl,
    ...theme.tokens.shadow.lg,
  },
  handleArea: { paddingVertical: theme.tokens.spacing.md, alignItems: 'center' },
  handle: { width: 40, height: 5, borderRadius: 3, backgroundColor: theme.colors.border },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.tokens.spacing.md,
    paddingHorizontal: theme.tokens.spacing.xl,
    paddingBottom: theme.tokens.spacing.md,
  },
  headerSpaced: { paddingTop: theme.tokens.spacing.xl },
  title: { flex: 1, fontSize: theme.tokens.fontSize.xl, fontWeight: theme.tokens.fontWeight.bold },
  content: { paddingHorizontal: theme.tokens.spacing.xl },
  scroll: { flexShrink: 1 },
  footer: {
    paddingHorizontal: theme.tokens.spacing.xl,
    paddingTop: theme.tokens.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  footerInline: { paddingTop: theme.tokens.spacing.xl },
}));

const absoluteFill: ViewStyle = { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 };

/**
 * BottomSheet
 * Sheet that slides in from the bottom, with drag to close (PanResponder, not
 * an external gesture-handler: the library is zero-dependency). Header, footer
 * and scroll are optional, so it covers both the bare sheet and the full
 * form.
 */
export const BottomSheet = memo(
  ({
    visible,
    onClose,
    children,
    title,
    footer,
    footerPlacement = 'fixed',
    scrollable = true,
    draggable = true,
    maxHeight = 0.9,
    closeAccessibilityLabel = 'Close',
    containerStyle,
    contentStyle,
    testID,
  }: BottomSheetProps) => {
    const styles = useStyles();
    const colors = useColors();
    const ModalSafeAreaBoundary = useModalSafeAreaBoundary();
    const [mounted, setMounted] = useState(visible);
    const [keyboardOpen, setKeyboardOpen] = useState(false);
    const progress = useRef(new Animated.Value(0)).current;
    // The PanResponder further down is created only once; reading `onClose`
    // straight from the closure would always give the one from that first
    // render. The ref reflects the latest prop no matter when the closure was created.
    const onCloseRef = useRef(onClose);
    onCloseRef.current = onClose;

    useEffect(() => {
      const animation = visible
        ? Animated.timing(progress, { toValue: 1, duration: 250, useNativeDriver: true })
        : Animated.timing(progress, { toValue: 0, duration: 200, useNativeDriver: true });
      if (visible) setMounted(true);
      animation.start(({ finished }) => {
        if (!visible && finished) setMounted(false);
      });
      // If the effect runs again (or the component unmounts) before it
      // finishes, it is cut short: otherwise, a late `finished` could call
      // `setMounted` on an already unmounted component.
      return () => animation.stop();
    }, [visible, progress]);

    useEffect(() => {
      if (footerPlacement !== 'hide-with-keyboard') return;
      const [show, hide] =
        Platform.OS === 'ios' ? ['keyboardWillShow', 'keyboardWillHide'] : ['keyboardDidShow', 'keyboardDidHide'];
      const subs = [
        Keyboard.addListener(show as 'keyboardDidShow', () => setKeyboardOpen(true)),
        Keyboard.addListener(hide as 'keyboardDidHide', () => setKeyboardOpen(false)),
      ];
      return () => subs.forEach((sub) => sub.remove());
    }, [footerPlacement]);

    const panResponder = useRef(
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) => gesture.dy > 5 && Math.abs(gesture.dy) > Math.abs(gesture.dx),
        onPanResponderMove: (_, gesture) => {
          if (gesture.dy > 0) progress.setValue(1 - Math.min(gesture.dy, SCREEN_HEIGHT) / SCREEN_HEIGHT);
        },
        onPanResponderRelease: (_, gesture) => {
          if (gesture.dy > DISMISS_THRESHOLD) {
            onCloseRef.current();
          } else {
            Animated.timing(progress, { toValue: 1, duration: 150, useNativeDriver: true }).start();
          }
        },
      })
    ).current;

    if (!mounted) return null;

    // Percentage, not pixels: it is measured against the container, which is
    // shorter with the keyboard open, so the sheet always fits entirely.
    const resolvedMaxHeight: number | `${number}%` = maxHeight <= 1 ? `${maxHeight * 100}%` : maxHeight;
    const hasHeader = !!title;

    const scrolledFooter = !!footer && footerPlacement === 'scroll' && (
      <View style={styles.footerInline}>{footer}</View>
    );
    const pinnedFooter =
      !!footer && footerPlacement !== 'scroll' && !(footerPlacement === 'hide-with-keyboard' && keyboardOpen) ? (
        <View style={styles.footer}>{footer}</View>
      ) : null;

    const body = scrollable ? (
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, contentStyle]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {children}
        {scrolledFooter}
      </ScrollView>
    ) : (
      <View style={[styles.content, contentStyle]}>
        {children}
        {scrolledFooter}
      </View>
    );

    return (
      <Modal visible transparent animationType="none" statusBarTranslucent onRequestClose={onClose}>
        {/* The sheet is anchored at the bottom, so the keyboard covers it
            entirely: it has to be pushed up, not adjusted with insets inside
            the scroll. A single compensation, the container's. */}
        <KeyboardHandled>
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <Transition value={progress} preset="fade" style={[absoluteFill, styles.backdrop]}>
            {/* With a header, the close button already exposes the action:
                repeating the label here leaves two elements with the same name. */}
            <Pressable
              style={absoluteFill}
              onPress={onClose}
              testID="bottom-sheet-backdrop"
              accessibilityRole={hasHeader ? undefined : 'button'}
              accessibilityLabel={hasHeader ? undefined : closeAccessibilityLabel}
            />
          </Transition>

          {/* Insets measured inside this native window (the native Modal
              BottomSheet uses underneath), not the app root's. */}
          <ModalSafeAreaBoundary>
            {(insets) => (
              <Transition
                value={progress}
                preset="slide-up"
                distance={SCREEN_HEIGHT}
                testID={testID}
                style={[
                  styles.sheet,
                  { maxHeight: resolvedMaxHeight, paddingBottom: Math.max(insets.bottom, 20) },
                  containerStyle,
                ]}
              >
                {draggable && (
                  <View style={styles.handleArea} testID="bottom-sheet-handle" {...panResponder.panHandlers}>
                    <View style={styles.handle} />
                  </View>
                )}

                {hasHeader && (
                  <View style={[styles.header, !draggable && styles.headerSpaced]}>
                    <Title style={styles.title} numberOfLines={1}>
                      {title}
                    </Title>
                    <IconButton
                      iconName="close"
                      size={24}
                      color={colors.text}
                      onPress={onClose}
                      accessibilityLabel={closeAccessibilityLabel}
                    />
                  </View>
                )}

                {body}

                {pinnedFooter}
              </Transition>
            )}
          </ModalSafeAreaBoundary>
        </KeyboardAvoidingView>
        </KeyboardHandled>
      </Modal>
    );
  }
);
BottomSheet.displayName = 'BottomSheet';
