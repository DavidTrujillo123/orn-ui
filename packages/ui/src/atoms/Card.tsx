import React, { memo } from 'react';
import { View, type StyleProp, type ViewProps, type ViewStyle } from 'react-native';
import { createStyles } from '../theme/createStyles';

export interface CardProps extends ViewProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

const CARD_BORDER_DARK = 1;

const useStyles = createStyles((theme) => ({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.tokens.radius.xl,
    padding: theme.tokens.spacing.lg,
    ...theme.tokens.shadow.sm,
    // In dark the shadow isn't visible and surface barely stands out from the
    // background (or not at all, on another surface): a 1pt border restores
    // the outline (figure and ground). A hairline was invisible.
    ...(theme.scheme === 'dark' && { borderWidth: CARD_BORDER_DARK, borderColor: theme.colors.border }),
  },
}));

/**
 * Card
 * Surface container: groups related content.
 *
 * Gestalt, common region: everything inside the same background and border
 * reads as a group, even when other elements are nearby. Figure and ground:
 * in light the shadow sets it apart; in dark (where the shadow isn't visible)
 * a thin border does. The inner padding (`spacing.lg`) must be larger than the
 * spacing between the elements inside, so the content reads as one block.
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
