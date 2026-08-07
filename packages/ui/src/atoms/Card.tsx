import React, { memo } from 'react';
import { View, type ViewProps, type ViewStyle } from 'react-native';
import { createStyles } from '../theme/createStyles';

export interface CardProps extends ViewProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

const useStyles = createStyles((theme) => ({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.tokens.radius.xl,
    padding: theme.tokens.spacing.lg,
    ...theme.tokens.shadow.sm,
  },
}));

export const Card = memo(({ children, style, ...props }: CardProps) => {
  const styles = useStyles();
  return (
    <View style={[styles.card, style]} {...props}>
      {children}
    </View>
  );
});
Card.displayName = 'Card';
