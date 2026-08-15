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
 * Hoja que entra desde abajo, con arrastre para cerrar (PanResponder, no un
 * gesture-handler externo: la librería es cero dependencias). Header, footer y
 * scroll son opcionales, así que cubre tanto la hoja desnuda como el formulario
 * completo.
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
    // El PanResponder de más abajo se crea una sola vez; leer `onClose`
    // directo del closure daría siempre el de ese primer render. El ref
    // refleja la última prop sin importar cuándo se creó la closure.
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
      // Si el efecto vuelve a correr (o el componente se desmonta) antes de
      // que termine, se corta: si no, un `finished` tardío podría llamar
      // `setMounted` sobre un componente ya desmontado.
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

    // Porcentaje y no píxeles: se mide contra el contenedor, que con el teclado
    // abierto es más bajo, así que la hoja entra siempre entera.
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
        {/* La hoja está anclada abajo, así que el teclado la tapa entera: hay
            que empujarla, no ajustar insets adentro del scroll. Una sola
            compensación, la del contenedor. */}
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <Transition value={progress} preset="fade" style={[absoluteFill, styles.backdrop]}>
            {/* Con header, el botón de cerrar ya expone la acción: repetir el
                label acá deja dos elementos con el mismo nombre. */}
            <Pressable
              style={absoluteFill}
              onPress={onClose}
              testID="bottom-sheet-backdrop"
              accessibilityRole={hasHeader ? undefined : 'button'}
              accessibilityLabel={hasHeader ? undefined : closeAccessibilityLabel}
            />
          </Transition>

          {/* Insets medidos dentro de esta ventana nativa (el Modal nativo que
              usa BottomSheet por debajo), no los de la raíz de la app. */}
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
      </Modal>
    );
  }
);
BottomSheet.displayName = 'BottomSheet';
