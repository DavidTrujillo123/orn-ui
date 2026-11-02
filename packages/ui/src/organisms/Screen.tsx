import React, { memo } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View, type ViewStyle } from 'react-native';
import { createStyles } from '../theme/createStyles';
import { useInsets, useTheme } from '../theme/UIProvider';
import { KeyboardHandled, KeyboardPanArea, useKeyboardHost } from '../theme/KeyboardAvoidance';

export type ScreenEdge = 'top' | 'bottom';

export interface ScreenProps {
  children: React.ReactNode;
  /**
   * Fixed bar on top (back button, title, actions). It stays in place while
   * the content scrolls or moves up for the keyboard. The top safe area goes
   * above it.
   */
  header?: React.ReactNode;
  style?: ViewStyle;
  scrollable?: boolean;
  contentContainerStyle?: ViewStyle;
  /** Which safe area insets to apply. @default ['top', 'bottom'] */
  edges?: ScreenEdge[];
  /**
   * Keeps the focused Input above the keyboard by moving only the content
   * (the `header` and a tab bar outside the Screen stay put). On iOS with
   * scroll, the ScrollView scrolls to it instead. Set to false when the
   * content brings its own keyboard handling.
   * @default true
   */
  keyboardAvoiding?: boolean;
}

const useStyles = createStyles((theme) => ({
  wrapper: { flex: 1, backgroundColor: theme.colors.background },
  container: { flex: 1 },
  contentContainer: { flexGrow: 1 },
  header: { backgroundColor: theme.colors.background },
}));

/**
 * Screen
 * Contenedor raíz de pantalla: fondo del theme, safe area (via insets del
 * UIProvider), teclado y scroll opcional resueltos de forma consistente.
 *
 * Teclado: con el UIProvider manejándolo (default), Screen desplaza solo su
 * contenido — recortado bajo el `header` — para dejar el Input enfocado sobre
 * el teclado. El header queda fijo y una barra de pestañas fuera del Screen
 * queda detrás del teclado, como en una app nativa. En iOS con scroll, el
 * ScrollView ya lleva el campo a la vista (automaticallyAdjustKeyboardInsets)
 * y no se suma nada. Sin host (`keyboardAvoidance={false}` en el provider)
 * queda el KeyboardAvoidingView de siempre.
 *
 * Gestalt, región común: el header comparte el fondo de la pantalla y queda
 * fijo; lo que se mueve es solo el contenido, así la navegación no se pierde.
 */
export const Screen = memo(({
  children,
  header,
  style,
  scrollable = true,
  contentContainerStyle,
  edges = ['top', 'bottom'],
  keyboardAvoiding = true,
}: ScreenProps) => {
  const insets = useInsets();
  const styles = useStyles();
  const theme = useTheme();
  const host = useKeyboardHost();
  const applyTop = edges.includes('top');
  const applyBottom = edges.includes('bottom');
  const topInset = applyTop ? insets.top : 0;

  const scrollHandles = keyboardAvoiding && scrollable && Platform.OS === 'ios';
  const panArea = keyboardAvoiding && !scrollHandles && !!host;
  const avoidWithView = keyboardAvoiding && !scrollHandles && !host;

  // Con header, el inset superior va arriba del header; el contenido arranca
  // pegado debajo.
  const contentTop = header ? 0 : topInset;

  let content = scrollable ? (
    <ScrollView
      style={styles.container}
      automaticallyAdjustKeyboardInsets={scrollHandles}
      contentContainerStyle={[
        styles.contentContainer,
        { paddingTop: contentTop },
        applyBottom && { paddingBottom: insets.bottom },
        contentContainerStyle,
      ]}
      keyboardShouldPersistTaps="handled"
    >
      {scrollHandles ? <KeyboardHandled>{children}</KeyboardHandled> : children}
    </ScrollView>
  ) : (
    <View style={[styles.container, { paddingTop: contentTop, paddingBottom: applyBottom ? insets.bottom : 0 }]}>
      {children}
    </View>
  );

  if (panArea) {
    content = (
      <KeyboardPanArea margin={theme.tokens.spacing.md} topLimit={insets.top} clip>
        {content}
      </KeyboardPanArea>
    );
  } else if (avoidWithView) {
    content = (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : theme.tokens.spacing.xl}
      >
        {content}
      </KeyboardAvoidingView>
    );
  }

  return (
    <View style={[styles.wrapper, style]}>
      {header && <View style={[styles.header, { paddingTop: topInset }]}>{header}</View>}
      {content}
    </View>
  );
});
Screen.displayName = 'Screen';
