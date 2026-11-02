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
 * Root screen container: theme background, safe area (via the UIProvider's
 * insets), keyboard and optional scroll handled consistently.
 *
 * Keyboard: with the UIProvider handling it (default), Screen shifts only its
 * content — clipped below the `header` — to keep the focused Input above the
 * keyboard. The header stays fixed and a tab bar outside the Screen stays
 * behind the keyboard, as in a native app. On iOS with scroll, the ScrollView
 * already brings the field into view (automaticallyAdjustKeyboardInsets) and
 * nothing is added. Without a host (`keyboardAvoidance={false}` on the
 * provider) the usual KeyboardAvoidingView remains.
 *
 * Gestalt, common region: the header shares the screen's background and stays
 * fixed; only the content moves, so navigation isn't lost.
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

  // With a header, the top inset goes above the header; the content starts
  // right below it.
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
