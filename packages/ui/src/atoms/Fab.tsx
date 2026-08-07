import React, { memo } from 'react';
import { type GestureResponderEvent, type StyleProp, type ViewStyle } from 'react-native';
import { PressableScale } from './PressableScale';
import { Icon } from '../icons/Icon';
import type { IconName } from '../icons/types';
import { createStyles } from '../theme/createStyles';
import { useColors } from '../theme/UIProvider';

export interface FabProps {
  onPress: (e: GestureResponderEvent) => void;
  iconName?: IconName;
  icon?: React.ReactNode;
  size?: number;
  bottom?: number;
  right?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel: string;
}

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
 * Botón flotante circular. `bottom`/`right` en vez del `tabBarHeight`
 * obligatorio de la versión original — el consumidor decide su propio
 * offset (con o sin tab bar).
 */
export const Fab = memo(
  ({ onPress, iconName = 'plus', icon, size = 60, bottom = 20, right = 20, color, style, accessibilityLabel }: FabProps) => {
    const styles = useStyles();
    const colors = useColors();
    return (
      <PressableScale
        onPress={onPress}
        style={[
          styles.fab,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            bottom,
            right,
            backgroundColor: color ?? colors.primary,
          },
          style,
        ]}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
      >
        {icon ?? <Icon name={iconName} size={size * 0.5} color={colors.white} />}
      </PressableScale>
    );
  }
);
Fab.displayName = 'Fab';
