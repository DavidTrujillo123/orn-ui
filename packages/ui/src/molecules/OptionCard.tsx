import React, { memo } from 'react';
import { Text, TouchableOpacity, type StyleProp, type ViewStyle } from 'react-native';
import { createStyles } from '../theme/createStyles';
import { useAllowFontScaling, useColors } from '../theme/UIProvider';
import { Icon } from '../icons/Icon';
import type { IconName } from '../icons/types';

export interface OptionCardProps {
  label: string;
  iconName: IconName;
  isSelected: boolean;
  onPress: () => void;
  /** 'vertical': ícono arriba, texto abajo centrado. 'horizontal': ícono y texto en fila. */
  layout?: 'vertical' | 'horizontal';
  style?: StyleProp<ViewStyle>;
}

const useStyles = createStyles((theme) => ({
  card: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.tokens.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.tokens.shadow.sm,
  },
  cardHorizontal: { flex: 1, flexDirection: 'row', padding: theme.tokens.spacing.md - 2, gap: theme.tokens.spacing.sm },
  cardVertical: { width: '31%', padding: theme.tokens.spacing.sm, gap: 5, minHeight: 100 },
  cardSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primarySoft,
    borderWidth: 1.5,
    elevation: 0,
    shadowOpacity: 0,
  },
  label: { color: theme.colors.textLight, fontWeight: theme.tokens.fontWeight.medium },
  labelVertical: { fontSize: theme.tokens.fontSize.xs, textAlign: 'center' },
  labelSelected: { color: theme.colors.primaryText },
}));

/**
 * OptionCard
 * Card con ícono+label que resalta con borde/fondo primary cuando
 * `isSelected`. Para elegir entre opciones excluyentes (forma de pago, tipo
 * de documento, etc).
 */
export const OptionCard = memo(
  ({ label, iconName, isSelected, onPress, layout = 'horizontal', style }: OptionCardProps) => {
    const colors = useColors();
    const styles = useStyles();
    const allowFontScaling = useAllowFontScaling();

    return (
      <TouchableOpacity
        // activeOpacity=1: esta tarjeta tiene elevation (sombra Android); animar su
        // propia opacity en el press dispara un bug de Android que redibuja la
        // sombra como un borde oscuro pegado al borde del componente.
        activeOpacity={1}
        style={[
          styles.card,
          layout === 'vertical' ? styles.cardVertical : styles.cardHorizontal,
          isSelected && styles.cardSelected,
          style,
        ]}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityState={{ selected: isSelected }}
        accessibilityLabel={label}
      >
        <Icon name={iconName} size={24} color={isSelected ? colors.primary : colors.textLight} />
        <Text
          allowFontScaling={allowFontScaling}
          style={[styles.label, layout === 'vertical' && styles.labelVertical, isSelected && styles.labelSelected]}
        >
          {label}
        </Text>
      </TouchableOpacity>
    );
  }
);
OptionCard.displayName = 'OptionCard';
