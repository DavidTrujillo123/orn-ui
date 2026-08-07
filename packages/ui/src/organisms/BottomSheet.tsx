import React, { memo, useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Modal, PanResponder, Pressable, View, type ViewStyle } from 'react-native';
import { createStyles } from '../theme/createStyles';
import { useInsets } from '../theme/UIProvider';

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
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.timing(translateY, { toValue: 0, duration: 250, useNativeDriver: true }).start();
      Animated.timing(backdropOpacity, { toValue: 1, duration: 250, useNativeDriver: true }).start();
    } else {
      Animated.timing(translateY, { toValue: SCREEN_HEIGHT, duration: 200, useNativeDriver: true }).start(({ finished }) => {
        if (finished) setMounted(false);
      });
      Animated.timing(backdropOpacity, { toValue: 0, duration: 200, useNativeDriver: true }).start();
    }
  }, [visible]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) => gesture.dy > 5 && Math.abs(gesture.dy) > Math.abs(gesture.dx),
      onPanResponderMove: (_, gesture) => {
        if (gesture.dy > 0) translateY.setValue(gesture.dy);
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dy > DISMISS_THRESHOLD) {
          onClose();
        } else {
          Animated.timing(translateY, { toValue: 0, duration: 150, useNativeDriver: true }).start();
        }
      },
    })
  ).current;

  if (!mounted) return null;

  return (
    <Modal visible transparent animationType="none" statusBarTranslucent onRequestClose={onClose}>
      <View style={styles.container}>
        <Animated.View style={[absoluteFill, styles.backdrop, { opacity: backdropOpacity }]}>
          <Pressable style={absoluteFill} onPress={onClose} accessibilityRole="button" accessibilityLabel={closeAccessibilityLabel} />
        </Animated.View>

        <Animated.View
          style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 20) }, { transform: [{ translateY }] }]}
        >
          <View style={styles.handleArea} {...panResponder.panHandlers}>
            <View style={styles.handle} />
          </View>
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
});
BottomSheet.displayName = 'BottomSheet';
