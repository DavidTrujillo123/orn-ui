import React, { memo } from 'react';
import { Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import { createStyles } from '../theme/createStyles';
import { useAllowFontScaling } from '../theme/UIProvider';

export interface KeyValueRowProps {
  /** Left side. A string or number gets the default label style; any other node renders as is. */
  label: React.ReactNode;
  /** Right side. A string or number gets the default value style (tabular digits); any other node renders as is. */
  value: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Only applies when `label` is a string or number. */
  labelStyle?: StyleProp<TextStyle>;
  /** Only applies when `value` is a string or number. */
  valueStyle?: StyleProp<TextStyle>;
  testID?: string;
}

const useStyles = createStyles((theme) => ({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: theme.tokens.spacing.md,
  },
  // Dos textos: alineados por la primera línea, así un valor que se parte en
  // varias líneas sigue leyéndose junto a su label.
  rowText: { alignItems: 'baseline' },
  // El label conserva su ancho natural hasta la mitad de la fila; el valor
  // encoge y se parte en líneas en vez de empujar la fila fuera de la pantalla.
  label: {
    flexShrink: 0,
    maxWidth: '50%',
    fontSize: theme.tokens.fontSize.sm,
    lineHeight: theme.tokens.lineHeight.sm,
    fontWeight: theme.tokens.fontWeight.semibold,
    color: theme.colors.textLight,
  },
  value: {
    flexShrink: 1,
    fontSize: theme.tokens.fontSize.sm,
    lineHeight: theme.tokens.lineHeight.sm,
    textAlign: 'right',
    color: theme.colors.text,
    // Dígitos de ancho fijo: en una columna de montos las cifras quedan
    // alineadas entre filas.
    fontVariant: ['tabular-nums'],
  },
}));

const isPrimitive = (node: React.ReactNode): node is string | number =>
  typeof node === 'string' || typeof node === 'number';

/**
 * KeyValueRow
 * Fila label (izquierda) / value (derecha). Si label/value son string o
 * number, se renderizan con el estilo default; si ya vienen envueltos en un
 * componente propio, se respetan tal cual.
 *
 * Gestalt, alineación y similitud: los labels comparten color y peso y los
 * valores se alinean al borde derecho con dígitos tabulares, así una pila de
 * filas se lee como dos columnas — qué a la izquierda, cuánto a la derecha.
 * Con label y valor de texto, la fila es un solo nodo de accesibilidad
 * ("Subtotal, $300.00"); si alguno es un nodo propio (un Badge, un botón) no
 * se fusiona, para no tapar lo que ese nodo anuncie o permita tocar.
 */
export const KeyValueRow = memo(
  ({ label, value, style, labelStyle, valueStyle, testID }: KeyValueRowProps) => {
    const styles = useStyles();
    const allowFontScaling = useAllowFontScaling();
    const merge = isPrimitive(label) && isPrimitive(value);
    return (
      <View style={[styles.row, merge && styles.rowText, style]} accessible={merge || undefined} testID={testID}>
        {isPrimitive(label) ? (
          <Text allowFontScaling={allowFontScaling} style={[styles.label, labelStyle]}>
            {label}
          </Text>
        ) : (
          label
        )}
        {isPrimitive(value) ? (
          <Text allowFontScaling={allowFontScaling} style={[styles.value, valueStyle]}>
            {value}
          </Text>
        ) : (
          value
        )}
      </View>
    );
  }
);
KeyValueRow.displayName = 'KeyValueRow';
