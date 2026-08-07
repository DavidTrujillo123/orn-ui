import React, { memo } from 'react';
import { Text, View, type ViewStyle } from 'react-native';
import { createStyles } from '../theme/createStyles';
import { useAllowFontScaling, useColors, useLabels } from '../theme/UIProvider';
import { Icon } from '../icons/Icon';
import type { IconName } from '../icons/types';

export interface EmptyStateProps {
  title?: string;
  description?: string;
  iconName?: IconName;
  icon?: React.ReactNode;
  style?: ViewStyle;
}

const useStyles = createStyles((theme) => ({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.tokens.spacing.xxl - 4,
    minHeight: 200,
  },
  title: {
    fontSize: theme.tokens.fontSize.lg,
    fontWeight: theme.tokens.fontWeight.semibold,
    color: theme.colors.textLight,
    marginTop: theme.tokens.spacing.md - 2,
    textAlign: 'center',
  },
  description: {
    fontSize: theme.tokens.fontSize.md,
    color: theme.colors.textLight,
    marginTop: theme.tokens.spacing.xs + 1,
    textAlign: 'center',
  },
}));

export const EmptyState = memo(
  ({ title, description, iconName = 'search', icon, style }: EmptyStateProps) => {
    const colors = useColors();
    const styles = useStyles();
    const labels = useLabels();
    const allowFontScaling = useAllowFontScaling();
    const resolvedTitle = title ?? labels.noResultsTitle;
    const resolvedDescription = description ?? labels.noResultsDescription;
    return (
      <View style={[styles.container, style]} accessible accessibilityRole="text">
        {icon ?? <Icon name={iconName} size={48} color={colors.textLight} />}
        <Text allowFontScaling={allowFontScaling} style={styles.title}>
          {resolvedTitle}
        </Text>
        <Text allowFontScaling={allowFontScaling} style={styles.description}>
          {resolvedDescription}
        </Text>
      </View>
    );
  }
);
EmptyState.displayName = 'EmptyState';
