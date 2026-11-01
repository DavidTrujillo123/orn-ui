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

/** Área táctil mínima recomendada por Apple (44pt) y Material (48dp ≈ 44pt). */
const MIN_TOUCH = 44;

/**
 * IconButton
 * Botón de solo ícono. `accessibilityLabel` es obligatorio: sin texto
 * visible, es la única forma de que un lector de pantalla anuncie qué hace.
 *
 * Fitts: el área visible es ícono + `spacing.sm` por lado (24 + 16 = 40pt con
 * el tamaño por defecto, 32pt con `size={16}`). `hitSlop` completa lo que
 * falta hasta 44pt sin agrandar el layout, así una fila de íconos conserva su
 * ritmo y cada uno sigue siendo fácil de tocar.
 *
 * Gestalt, figura y fondo: no tiene fondo propio, el ícono es la figura sobre
 * lo que haya detrás; por eso el color por defecto es `colors.text` (contraste
 * AA garantizado) y `disabled` lo atenúa a la mitad.
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
