import React, { memo } from 'react';
import { StyleSheet, View, type StyleProp, type ViewProps, type ViewStyle } from 'react-native';
import { createStyles } from '../theme/createStyles';

export interface CardProps extends ViewProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

const useStyles = createStyles((theme) => ({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.tokens.radius.xl,
    padding: theme.tokens.spacing.lg,
    ...theme.tokens.shadow.sm,
    // En dark la sombra no se ve y surface apenas se distingue del fondo:
    // un borde fino recupera el contorno (figura y fondo).
    ...(theme.scheme === 'dark' && { borderWidth: StyleSheet.hairlineWidth, borderColor: theme.colors.border }),
  },
}));

/**
 * Card
 * Contenedor de superficie: agrupa contenido relacionado.
 *
 * Gestalt, región común: todo lo que está dentro del mismo fondo y borde se
 * lee como un grupo, aunque haya otros elementos cerca. Figura y fondo: en
 * light la separa la sombra; en dark (donde la sombra no se ve) un borde fino.
 * El padding interno (`spacing.lg`) debe ser mayor que la separación entre
 * los elementos de adentro, así el contenido se lee como un bloque.
 */

export const Card = memo(({ children, style, ...props }: CardProps) => {
  const styles = useStyles();
  return (
    <View style={[styles.card, style]} {...props}>
      {children}
    </View>
  );
});
Card.displayName = 'Card';
