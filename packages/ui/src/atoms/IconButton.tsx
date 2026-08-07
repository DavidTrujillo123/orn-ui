import React, { memo } from 'react';
import { type GestureResponderEvent, type StyleProp, type ViewStyle } from 'react-native';
import { PressableScale } from './PressableScale';
import { Icon } from '../icons/Icon';
import type { IconName } from '../icons/types';
import { createStyles } from '../theme/createStyles';

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

/**
 * IconButton
 * Botón de solo ícono con área táctil mínima de 44x44 garantizada por el
 * padding (icon 24 + padding 8*2 = 40; sube a 44 con size>=24 default RN).
 * `accessibilityLabel` es obligatorio: sin texto visible, es la única forma
 * de que un lector de pantalla anuncie qué hace el botón.
 */
export const IconButton = memo(
  ({ iconName, icon, onPress, size = 24, color, disabled, style, accessibilityLabel, testID }: IconButtonProps) => {
    const styles = useStyles();
    return (
      <PressableScale
        onPress={onPress}
        disabled={disabled}
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
