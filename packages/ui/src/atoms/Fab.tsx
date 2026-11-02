import React, { memo } from 'react';
import { type GestureResponderEvent, type StyleProp, type ViewStyle } from 'react-native';
import { PressableScale } from './PressableScale';
import { Icon } from '../icons/Icon';
import { onColor } from '../icons/defaultIcons';
import type { IconName } from '../icons/types';
import { createStyles } from '../theme/createStyles';
import { useColors, useInsets, useTheme } from '../theme/UIProvider';

export interface FabProps {
  onPress: (e: GestureResponderEvent) => void;
  /** Built-in or custom icon name. Ignored when `icon` is passed. @default 'plus' */
  iconName?: IconName;
  /** Any node in place of the icon. */
  icon?: React.ReactNode;
  /** Diameter in pt. @default 60 */
  size?: number;
  /** Distance from the bottom edge, on top of the safe area. @default tokens.spacing.xl (20) */
  bottom?: number;
  /** Distance from the right edge, on top of the safe area. @default tokens.spacing.xl (20) */
  right?: number;
  /**
   * Adds the safe-area insets to `bottom`/`right`, so the button clears the
   * home indicator. Pass false above a NavigationBar or tab bar, which
   * already covers that edge. @default true
   */
  safeArea?: boolean;
  /** Fill color. The icon switches to black or white for contrast. @default theme.colors.primary */
  color?: string;
  style?: StyleProp<ViewStyle>;
  /** Required: the button has no visible text. */
  accessibilityLabel: string;
  testID?: string;
}

/** Default diameter: comfortably above the 44pt touch minimum (Fitts). */
const DEFAULT_SIZE = 60;
/** The glyph takes up half the circle. */
const ICON_RATIO = 0.5;

const useStyles = createStyles((theme) => ({
  fab: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.tokens.shadow.lg,
  },
}));

/**
 * Fab
 * Circular floating button for the screen's main action.
 * `bottom`/`right` instead of the required `tabBarHeight` of the original
 * version — the consumer decides its own offset (with or without a tab bar).
 *
 * Gestalt, figure/ground: it is the only thing that floats (`lg` shadow) and
 * carries the accent, so it stands apart from the content passing beneath it
 * (Von Restorff: one per screen). Fitts: large and in the thumb's corner,
 * above the safe area so it doesn't compete with the home gesture.
 */
export const Fab = memo(
  ({
    onPress,
    iconName = 'plus',
    icon,
    size = DEFAULT_SIZE,
    bottom,
    right,
    safeArea = true,
    color,
    style,
    accessibilityLabel,
    testID,
  }: FabProps) => {
    const styles = useStyles();
    const colors = useColors();
    const theme = useTheme();
    const insets = useInsets();
    const fill = color ?? colors.primary;
    // With the theme color, its `onPrimary`; with a custom one, black or white
    // depending on contrast (a cyan with a white icon was unreadable).
    const glyph = color ? onColor(color) : colors.onPrimary;
    const edge = theme.tokens.spacing.xl;

    return (
      <PressableScale
        onPress={onPress}
        style={[
          styles.fab,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            bottom: (bottom ?? edge) + (safeArea ? insets.bottom : 0),
            right: (right ?? edge) + (safeArea ? insets.right : 0),
            backgroundColor: fill,
          },
          style,
        ]}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        testID={testID}
      >
        {icon ?? <Icon name={iconName} size={size * ICON_RATIO} color={glyph} />}
      </PressableScale>
    );
  }
);
Fab.displayName = 'Fab';
