import React, { memo } from 'react';
import { Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { createStyles } from '../theme/createStyles';
import { useAllowFontScaling, useColors } from '../theme/UIProvider';
import { Icon } from '../icons/Icon';
import type { IconName } from '../icons/types';
import { Avatar } from '../atoms/Avatar';

export interface InfoRowProps {
  icon: IconName;
  label: string;
  value: string | null | undefined;
  placeholder: string;
  style?: StyleProp<ViewStyle>;
}

const useStyles = createStyles((theme) => ({
  row: { flexDirection: 'row', alignItems: 'center' },
  icon: { marginRight: theme.tokens.spacing.md },
  textContainer: { flex: 1 },
  label: { fontSize: theme.tokens.fontSize.sm, color: theme.colors.textLight, marginBottom: 2 },
  value: { fontSize: theme.tokens.fontSize.md + 1, color: theme.colors.text, fontWeight: theme.tokens.fontWeight.medium },
  placeholder: { color: theme.colors.textLight, fontStyle: 'italic' },
}));

/**
 * InfoRow
 * Ícono circular a la izquierda + label/valor apilado a la derecha. Muestra
 * `placeholder` en itálica si no hay valor. Pensado para modales de detalle.
 */
export const InfoRow = memo(({ icon, label, value, placeholder, style }: InfoRowProps) => {
  const colors = useColors();
  const styles = useStyles();
  const allowFontScaling = useAllowFontScaling();

  return (
    <View style={[styles.row, style]}>
      <Avatar size={40} backgroundColor={colors.inputBackground} style={styles.icon}>
        <Icon name={icon} size={20} color={colors.textLight} />
      </Avatar>
      <View style={styles.textContainer}>
        <Text allowFontScaling={allowFontScaling} style={styles.label}>
          {label}
        </Text>
        <Text allowFontScaling={allowFontScaling} style={[styles.value, !value && styles.placeholder]}>
          {value || placeholder}
        </Text>
      </View>
    </View>
  );
});
InfoRow.displayName = 'InfoRow';
