import React, { memo } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View, type ViewStyle } from 'react-native';
import { createStyles } from '../theme/createStyles';
import { useInsets } from '../theme/UIProvider';

export type ScreenEdge = 'top' | 'bottom';

export interface ScreenProps {
  children: React.ReactNode;
  style?: ViewStyle;
  scrollable?: boolean;
  contentContainerStyle?: ViewStyle;
  /** Qué insets de safe area aplicar. @default ['top', 'bottom'] */
  edges?: ScreenEdge[];
  /**
   * Compensa el teclado: en iOS con scroll lo hace el propio ScrollView, en el
   * resto de los casos con un KeyboardAvoidingView. Ponelo en false cuando
   * el contenido ya trae su propio scroller que maneja el teclado (Wizard,
   * List, SearchList): las dos compensaciones se suman y el campo enfocado
   * termina empujado fuera de la pantalla.
   * @default true
   */
  keyboardAvoiding?: boolean;
}

const useStyles = createStyles((theme) => ({
  wrapper: { flex: 1, backgroundColor: theme.colors.background },
  container: { flex: 1 },
  contentContainer: { flexGrow: 1 },
}));

/**
 * Screen
 * Contenedor raíz de pantalla: fondo del theme, safe area (via insets del
 * UIProvider), teclado y scroll opcional resueltos de forma consistente.
 */
export const Screen = memo(({
  children,
  style,
  scrollable = true,
  contentContainerStyle,
  edges = ['top', 'bottom'],
  keyboardAvoiding = true,
}: ScreenProps) => {
  const insets = useInsets();
  const styles = useStyles();
  const applyTop = edges.includes('top');
  const applyBottom = edges.includes('bottom');

  // En iOS el ScrollView de abajo ya sube el campo enfocado con
  // automaticallyAdjustKeyboardInsets; envolverlo además en un
  // KeyboardAvoidingView compensa el teclado dos veces y el input termina
  // empujado fuera del borde superior. Android no tiene ese prop, así que ahí
  // el KeyboardAvoidingView sigue siendo el único mecanismo.
  const avoidWithView = keyboardAvoiding && !(scrollable && Platform.OS === 'ios');

  const KeyboardWrapper: React.ComponentType<any> = avoidWithView ? KeyboardAvoidingView : View;
  const keyboardProps = avoidWithView
    ? {
        behavior: Platform.OS === 'ios' ? ('padding' as const) : ('height' as const),
        keyboardVerticalOffset: Platform.OS === 'ios' ? 0 : 20,
      }
    : {};

  return (
    <View style={[styles.wrapper, style]}>
      <KeyboardWrapper style={styles.container} {...keyboardProps}>
        {scrollable ? (
          <ScrollView
            style={styles.container}
            contentInsetAdjustmentBehavior="automatic"
            automaticallyAdjustKeyboardInsets
            contentContainerStyle={[
              styles.contentContainer,
              { paddingTop: applyTop ? insets.top : 0 },
              Platform.OS === 'android' && applyBottom && { paddingBottom: insets.bottom },
              contentContainerStyle,
            ]}
            keyboardShouldPersistTaps="handled"
          >
            {children}
          </ScrollView>
        ) : (
          <View style={[styles.container, { paddingTop: applyTop ? insets.top : 0, paddingBottom: applyBottom ? insets.bottom : 0 }]}>
            {children}
          </View>
        )}
      </KeyboardWrapper>
    </View>
  );
});
Screen.displayName = 'Screen';
