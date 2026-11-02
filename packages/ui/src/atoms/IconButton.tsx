import React, { memo } from 'react';
import { type GestureResponderEvent, type StyleProp, type ViewStyle } from 'react-native';
import { PressableScale } from './PressableScale';
import { Icon } from '../icons/Icon';
import type { IconName } from '../icons/types';
import { createStyles } from '../theme/createStyles';
import { useTheme } from '../theme/UIProvider';

export interface IconButtonProps {
  iconName?: IconName;
  icon?: React.ReactNode;
  onPress?: (e: GestureResponderEvent) => void;
  size?: number;
  color?: string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel: string;
  testID?: string;
}

const useStyles = createStyles((theme) => ({
  hitArea: {
    padding: theme.tokens.spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
}));

/** Minimum touch area recommended by Apple (44pt) and Material (48dp ≈ 44pt). */
const MIN_TOUCH = 44;

/**
 * IconButton
 * Icon-only button. `accessibilityLabel` is required: with no visible text,
 * it is the only way for a screen reader to announce what it does.
 *
 * Fitts: the visible area is icon + `spacing.sm` per side (24 + 16 = 40pt
 * with the default size, 32pt with `size={16}`). `hitSlop` makes up the
 * rest up to 44pt without enlarging the layout, so a row of icons keeps its
 * rhythm and each one is still easy to tap.
 *
 * Gestalt, figure and ground: it has no background of its own, the icon is
 * the figure over whatever is behind it; that is why the default color is
 * `colors.text` (guaranteed AA contrast) and `disabled` dims it by half.
 */
export const IconButton = memo(
  ({ iconName, icon, onPress, size = 24, color, disabled, style, accessibilityLabel, testID }: IconButtonProps) => {
    const styles = useStyles();
    const theme = useTheme();
    const visible = size + theme.tokens.spacing.sm * 2;
    const extra = Math.max(0, Math.ceil((MIN_TOUCH - visible) / 2));
    const hitSlop = extra > 0 ? { top: extra, bottom: extra, left: extra, right: extra } : undefined;
    return (
      <PressableScale
        onPress={onPress}
        disabled={disabled}
        hitSlop={hitSlop}
        style={[styles.hitArea, { opacity: disabled ? 0.5 : 1 }, style]}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ disabled: !!disabled }}
        testID={testID}
      >
        {icon ?? (iconName && <Icon name={iconName} size={size} color={color} />)}
      </PressableScale>
    );
  }
);
IconButton.displayName = 'IconButton';
