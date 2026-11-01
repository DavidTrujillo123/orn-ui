import React, { memo } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '../theme/UIProvider';
import type { Tokens } from '../theme/tokens';

export interface DividerProps {
  /** `vertical` separa elementos en una fila; se estira al alto de la fila. @default 'horizontal' */
  orientation?: 'horizontal' | 'vertical';
  /** Aire a cada lado de la línea, de la escala de espaciado. Sin valor, la línea no agrega margen. */
  spacing?: keyof Tokens['spacing'];
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/**
 * Divider
 * Línea de 1pt en `colors.border`.
 *
 * Gestalt: separa grupos cuando la proximidad sola no alcanza (listas
 * densas, filas que cruzan toda la pantalla). Si el espacio ya separa los
 * grupos, preferir el espacio: una línea de más fragmenta lo que debería
 * leerse junto. `spacing` toma el aire de la escala de tokens para que la
 * separación sea la misma en toda la app, en vez de un margen distinto en
 * cada pantalla.
 *
 * Es decorativo: no entra en el árbol de accesibilidad.
 */
export const Divider = memo(({ orientation = 'horizontal', spacing, style, testID }: DividerProps) => {
  const theme = useTheme();
  const gap = spacing ? theme.tokens.spacing[spacing] : 0;
  const line: ViewStyle =
    orientation === 'vertical'
      ? { width: 1, alignSelf: 'stretch', marginHorizontal: gap }
      : { height: 1, width: '100%', marginVertical: gap };
  return (
    <View
      testID={testID}
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
      style={[line, { backgroundColor: theme.colors.border }, style]}
    />
  );
});
Divider.displayName = 'Divider';
