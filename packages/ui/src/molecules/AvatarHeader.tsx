import React, { memo } from 'react';
import { Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { createStyles } from '../theme/createStyles';
import { useAllowFontScaling, useColors } from '../theme/UIProvider';
import { Icon } from '../icons/Icon';
import type { IconName } from '../icons/types';

export interface AvatarHeaderProps {
  /** Ícono a mostrar dentro del círculo. Si se omite, se usan `initials`. */
  iconName?: IconName;
  iconColor?: string;
  /** Texto corto (ej. 2 letras) mostrado si no se pasa `iconName`. */
  initials?: string;
  title: string;
  subtitle?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

const useStyles = createStyles((theme) => ({
  container: { alignItems: 'center', marginBottom: theme.tokens.spacing.xl },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.tokens.spacing.md,
  },
  initials: { fontSize: theme.tokens.fontSize.xxl, fontWeight: theme.tokens.fontWeight.bold, color: theme.colors.primary },
  title: { fontSize: theme.tokens.fontSize.xl, fontWeight: theme.tokens.fontWeight.bold, textAlign: 'center', color: theme.colors.text, marginBottom: theme.tokens.spacing.xs },
  subtitle: { fontSize: theme.tokens.fontSize.md, color: theme.colors.textLight },
}));

/**
 * AvatarHeader
 * Círculo 80x80 con ícono o iniciales + título/subtítulo centrado. Header
 * típico de modales de detalle (cliente, producto, etc).
 */
export const AvatarHeader = memo(({ iconName, iconColor, initials, title, subtitle, style }: AvatarHeaderProps) => {
  const colors = useColors();
  const styles = useStyles();
  const allowFontScaling = useAllowFontScaling();

  return (
    <View style={[styles.container, style]}>
      <View style={styles.avatar}>
        {iconName ? (
          <Icon name={iconName} size={40} color={iconColor || colors.primary} />
        ) : (
          <Text allowFontScaling={allowFontScaling} style={styles.initials}>
            {initials}
          </Text>
        )}
      </View>
      <Text allowFontScaling={allowFontScaling} style={styles.title}>
        {title}
      </Text>
      {typeof subtitle === 'string' ? (
        <Text allowFontScaling={allowFontScaling} style={styles.subtitle}>
          {subtitle}
        </Text>
      ) : (
        subtitle
      )}
    </View>
  );
});
AvatarHeader.displayName = 'AvatarHeader';
