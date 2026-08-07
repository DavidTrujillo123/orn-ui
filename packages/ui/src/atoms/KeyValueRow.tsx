import React, { memo } from 'react';
import { Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import { createStyles } from '../theme/createStyles';
import { useAllowFontScaling } from '../theme/UIProvider';

export interface KeyValueRowProps {
  label: React.ReactNode;
  value: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
  valueStyle?: StyleProp<TextStyle>;
}

const useStyles = createStyles((theme) => ({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { fontSize: theme.tokens.fontSize.sm, fontWeight: theme.tokens.fontWeight.semibold, color: theme.colors.textLight },
  value: { fontSize: theme.tokens.fontSize.sm, textAlign: 'right', color: theme.colors.text },
}));

/**
 * KeyValueRow
 * Fila label (izquierda) / value (derecha). Si label/value son string o
 * number, se renderizan con el estilo default; si ya vienen envueltos en un
 * componente de texto propio, se respetan tal cual.
 */
export const KeyValueRow = memo(({ label, value, style, labelStyle, valueStyle }: KeyValueRowProps) => {
  const styles = useStyles();
  const allowFontScaling = useAllowFontScaling();
  return (
    <View style={[styles.row, style]}>
      {typeof label === 'string' || typeof label === 'number' ? (
        <Text allowFontScaling={allowFontScaling} style={[styles.label, labelStyle]}>
          {label}
        </Text>
      ) : (
        label
      )}
      {typeof value === 'string' || typeof value === 'number' ? (
        <Text allowFontScaling={allowFontScaling} style={[styles.value, valueStyle]}>
          {value}
        </Text>
      ) : (
        value
      )}
    </View>
  );
});
KeyValueRow.displayName = 'KeyValueRow';
