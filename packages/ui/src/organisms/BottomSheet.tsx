import React, { memo, useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Modal, PanResponder, Pressable, View, type ViewStyle } from 'react-native';
import { createStyles } from '../theme/createStyles';
import { useInsets } from '../theme/UIProvider';
import { Transition } from '../atoms/Transition';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const DISMISS_THRESHOLD = 100;

export interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  closeAccessibilityLabel?: string;
}

const useStyles = createStyles((theme) => ({
  container: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { backgroundColor: theme.colors.overlay },
  sheet: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.tokens.radius.xxl,
    borderTopRightRadius: theme.tokens.radius.xxl,
    paddingHorizontal: theme.tokens.spacing.xl,
    ...theme.tokens.shadow.lg,
  },
  handleArea: { paddingVertical: theme.tokens.spacing.md, alignItems: 'center' },
  handle: { width: 40, height: 5, borderRadius: 3, backgroundColor: theme.colors.border },
}));

const absoluteFill: ViewStyle = { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 };

/**
 * BottomSheet
 * Modal que aparece desde abajo: animación con Animated (no la del Modal
 * nativo) y arrastre para cerrar con PanResponder — no un gesture-handler
 * externo, para mantener la librería en cero dependencias.
 */
export const BottomSheet = memo(({ visible, onClose, children, closeAccessibilityLabel = 'Close' }: BottomSheetProps) => {
  const styles = useStyles();
  const insets = useInsets();
  const [mounted, setMounted] = useState(visible);
  // Un único progreso 0→1 para la hoja y el fondo: el arrastre lo mueve a mano
  // y los Transition sólo interpolan sobre él.
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.timing(progress, { toValue: 1, duration: 250, useNativeDriver: true }).start();
    } else {
      Animated.timing(progress, { toValue: 0, duration: 200, useNativeDriver: true }).start(({ finished }) => {
        if (finished) setMounted(false);
      });
    }
  }, [visible, progress]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) => gesture.dy > 5 && Math.abs(gesture.dy) > Math.abs(gesture.dx),
      onPanResponderMove: (_, gesture) => {
        if (gesture.dy > 0) progress.setValue(1 - Math.min(gesture.dy, SCREEN_HEIGHT) / SCREEN_HEIGHT);
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dy > DISMISS_THRESHOLD) {
          onClose();
        } else {
          Animated.timing(progress, { toValue: 1, duration: 150, useNativeDriver: true }).start();
        }
      },
    })
  ).current;

  if (!mounted) return null;

  return (
    <Modal visible transparent animationType="none" statusBarTranslucent onRequestClose={onClose}>
      <View style={styles.container}>
        <Transition value={progress} preset="fade" style={[absoluteFill, styles.backdrop]}>
          <Pressable style={absoluteFill} onPress={onClose} accessibilityRole="button" accessibilityLabel={closeAccessibilityLabel} />
        </Transition>

        <Transition
          value={progress}
          preset="slide-up"
          distance={SCREEN_HEIGHT}
          style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 20) }]}
        >
          <View style={styles.handleArea} {...panResponder.panHandlers}>
            <View style={styles.handle} />
          </View>
          {children}
        </Transition>
      </View>
    </Modal>
  );
});
BottomSheet.displayName = 'BottomSheet';
