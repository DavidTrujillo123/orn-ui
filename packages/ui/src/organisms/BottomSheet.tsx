import React, { memo, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  View,
  useWindowDimensions,
  type ViewStyle,
} from 'react-native';
import { createStyles } from '../theme/createStyles';
import { useColors, useLabels, useModalSafeAreaBoundary, useTheme } from '../theme/UIProvider';
import { useReduceMotion } from '../theme/useReduceMotion';
import { KeyboardHandled } from '../theme/KeyboardAvoidance';
import { NativeOverlay } from '../theme/NativeOverlay';
import { Title } from '../atoms/Text';
import { IconButton } from '../atoms/IconButton';
import { Transition } from '../atoms/Transition';

/** Drag distance (pt) that closes the sheet on release. */
const DISMISS_DISTANCE = 100;
/** Downward release speed that closes it even after a short drag (a flick). */
const DISMISS_VELOCITY = 0.5;
const HANDLE_WIDTH = 40;
const HANDLE_HEIGHT = 5;
const HANDLE_OPACITY = 0.4;
const CLOSE_ICON_SIZE = 24;

export type FooterPlacement = 'fixed' | 'scroll' | 'hide-with-keyboard';

export interface BottomSheetProps {
  /** Shows or hides the sheet (it slides in and out). */
  visible: boolean;
  /** Called by the backdrop, the close button, the drag and Android back. */
  onClose: () => void;
  /** Sheet content. */
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
  /** Accessible name of the close button and backdrop. @default labels.close */
  closeAccessibilityLabel?: string;
  /** Style of the sheet itself (background, radius). */
  containerStyle?: ViewStyle;
  /** Style of the content area (padding). */
  contentStyle?: ViewStyle;
  /** Draws the sheet inside its parent instead of over the screen (docs, previews). @default false */
  inline?: boolean;
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
  handle: {
    width: HANDLE_WIDTH,
    height: HANDLE_HEIGHT,
    borderRadius: HANDLE_HEIGHT / 2,
    // textLight, faded: `border` was nearly invisible on a white sheet, and
    // the handle is the only hint that the sheet can be dragged.
    backgroundColor: theme.colors.textLight,
    opacity: HANDLE_OPACITY,
  },
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
 *
 * Gestalt, figure-ground: the backdrop dims the screen, so the sheet is the
 * only figure. Common region: header, content and footer share one panel;
 * the footer's top border separates the actions from the content. Continuity:
 * it slides from the edge it lives on and the drag follows the finger back
 * down; a short flick closes it too. Fitts: content sits in the thumb zone.
 * Reduce Motion: it appears and leaves without sliding.
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
    closeAccessibilityLabel,
    containerStyle,
    contentStyle,
    inline = false,
    testID,
  }: BottomSheetProps) => {
    const styles = useStyles();
    const colors = useColors();
    const theme = useTheme();
    const labels = useLabels();
    const reduceMotion = useReduceMotion();
    const { height: screenHeight } = useWindowDimensions();
    const closeLabel = closeAccessibilityLabel ?? labels.close;
    const { duration } = theme.tokens;
    // The PanResponder is created once: it reads these through refs.
    const screenHeightRef = useRef(screenHeight);
    screenHeightRef.current = screenHeight;
    const snapBackMs = useRef(duration.fast);
    snapBackMs.current = reduceMotion ? 0 : duration.fast;
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
      const animation = Animated.timing(progress, {
        toValue: visible ? 1 : 0,
        duration: reduceMotion ? 0 : visible ? duration.slow : duration.base,
        useNativeDriver: true,
      });
      if (visible) setMounted(true);
      animation.start(({ finished }) => {
        if (!visible && finished) setMounted(false);
      });
      // If the effect runs again (or the component unmounts) before it
      // finishes, it is cut short: otherwise, a late `finished` could call
      // `setMounted` on an already unmounted component.
      return () => animation.stop();
    }, [visible, progress, reduceMotion, duration.slow, duration.base]);

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
          const h = screenHeightRef.current;
          if (gesture.dy > 0) progress.setValue(1 - Math.min(gesture.dy, h) / h);
        },
        onPanResponderRelease: (_, gesture) => {
          if (gesture.dy > DISMISS_DISTANCE || (gesture.dy > 0 && gesture.vy > DISMISS_VELOCITY)) {
            onCloseRef.current();
          } else {
            Animated.timing(progress, { toValue: 1, duration: snapBackMs.current, useNativeDriver: true }).start();
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

    const tree = (
        <>
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
              accessibilityLabel={hasHeader ? undefined : closeLabel}
            />
          </Transition>

          {/* Insets measured inside this native window (the native Modal
              BottomSheet uses underneath), not the app root's. */}
          <ModalSafeAreaBoundary>
            {(insets) => (
              <Transition
                value={progress}
                preset="slide-up"
                distance={screenHeight}
                testID={testID}
                style={[
                  styles.sheet,
                  { maxHeight: resolvedMaxHeight, paddingBottom: Math.max(insets.bottom, theme.tokens.spacing.xl) },
                  containerStyle,
                ]}
              >
                {draggable && (
                  // Decorative for screen readers: closing is already exposed by the
                  // close button (with a title) or by the backdrop (without one).
                  <View
                    style={styles.handleArea}
                    testID="bottom-sheet-handle"
                    accessibilityElementsHidden
                    importantForAccessibility="no-hide-descendants"
                    {...panResponder.panHandlers}
                  >
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
                      size={CLOSE_ICON_SIZE}
                      color={colors.text}
                      onPress={onClose}
                      accessibilityLabel={closeLabel}
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
        </>
    );

    if (inline) {
      return (
        <View style={absoluteFill} pointerEvents="box-none">
          {tree}
        </View>
      );
    }

    return (
      // closing: while the exit animation plays, no other overlay layers into it.
      <NativeOverlay closing={!visible} transparent animationType="none" statusBarTranslucent onRequestClose={onClose}>
        {tree}
      </NativeOverlay>
    );
  }
);
BottomSheet.displayName = 'BottomSheet';
