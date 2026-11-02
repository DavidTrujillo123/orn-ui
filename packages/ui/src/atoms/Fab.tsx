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

/** Diámetro por defecto: holgado sobre el mínimo táctil de 44pt (Fitts). */
const DEFAULT_SIZE = 60;
/** El glifo ocupa la mitad del círculo. */
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
 * Botón flotante circular para la acción principal de la pantalla.
 * `bottom`/`right` en vez del `tabBarHeight` obligatorio de la versión
 * original — el consumidor decide su propio offset (con o sin tab bar).
 *
 * Gestalt, figura/fondo: es lo único que flota (sombra `lg`) y lleva el
 * acento, así se separa del contenido que pasa por debajo (Von Restorff: una
 * sola por pantalla). Fitts: grande y en la esquina del pulgar, por encima
 * del safe area para no competir con el gesto de inicio.
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
    // Con el color del theme, su `onPrimary`; con uno propio, negro o blanco
    // según el contraste (un cian con ícono blanco no se leía).
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
