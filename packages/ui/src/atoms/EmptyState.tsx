import React, { memo } from 'react';
import { Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { createStyles } from '../theme/createStyles';
import { useAllowFontScaling, useColors, useLabels } from '../theme/UIProvider';
import { Icon } from '../icons/Icon';
import type { IconName } from '../icons/types';
import { Button, type ButtonVariant } from './Button';

export interface EmptyStateAction {
  label: string;
  onPress: () => void;
  /** @default 'primary' */
  variant?: ButtonVariant;
}

export interface EmptyStateProps {
  /** Main line. @default labels.noResultsTitle */
  title?: string;
  /** Supporting line under the title. @default labels.noResultsDescription */
  description?: string;
  /** Built-in or custom icon name. Ignored when `icon` is passed. @default 'search' */
  iconName?: IconName;
  /** Any node in place of the icon (an Image, an illustration). */
  icon?: React.ReactNode;
  /** The next step, shown as a button under the text (e.g. "Add client"). */
  action?: EmptyStateAction;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/** Tamaño del ícono: punto focal del bloque sin competir con el título. */
const ICON_SIZE = 48;
/** Alto mínimo: el bloque no se aplasta dentro de una lista vacía corta. */
const MIN_HEIGHT = 200;

const useStyles = createStyles((theme) => ({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.tokens.spacing.xl,
    minHeight: MIN_HEIGHT,
  },
  title: {
    fontSize: theme.tokens.fontSize.lg,
    fontWeight: theme.tokens.fontWeight.semibold,
    lineHeight: theme.tokens.lineHeight.lg,
    color: theme.colors.text,
    marginTop: theme.tokens.spacing.md,
    textAlign: 'center',
  },
  description: {
    fontSize: theme.tokens.fontSize.md,
    lineHeight: theme.tokens.lineHeight.md,
    color: theme.colors.textLight,
    marginTop: theme.tokens.spacing.xs,
    textAlign: 'center',
  },
  message: { alignItems: 'center' },
  action: { marginTop: theme.tokens.spacing.lg },
}));

/**
 * EmptyState
 * Ícono + título + descripción centrados para una lista o pantalla sin datos.
 *
 * Gestalt, proximidad: título y descripción van pegados (`spacing.xs`) y el
 * ícono un paso más lejos (`spacing.md`), así se leen como un mensaje con su
 * imagen y no como tres piezas sueltas. Similitud: el título en `text` y la
 * descripción en `textLight` marcan la jerarquía. La acción, si hay, queda
 * más separada (`spacing.lg`): es el siguiente paso, no parte del mensaje.
 * El mensaje es un solo nodo de accesibilidad (título y descripción juntos;
 * el ícono es decorativo) y el botón, uno aparte que se puede enfocar.
 */
export const EmptyState = memo(
  ({ title, description, iconName = 'search', icon, action, style, testID }: EmptyStateProps) => {
    const colors = useColors();
    const styles = useStyles();
    const labels = useLabels();
    const allowFontScaling = useAllowFontScaling();
    const resolvedTitle = title ?? labels.noResultsTitle;
    const resolvedDescription = description ?? labels.noResultsDescription;
    return (
      <View style={[styles.container, style]} testID={testID}>
        <View style={styles.message} accessible accessibilityRole="text">
          {icon ?? <Icon name={iconName} size={ICON_SIZE} color={colors.textLight} />}
          <Text allowFontScaling={allowFontScaling} style={styles.title}>
            {resolvedTitle}
          </Text>
          <Text allowFontScaling={allowFontScaling} style={styles.description}>
            {resolvedDescription}
          </Text>
        </View>
        {action && (
          <Button
            title={action.label}
            onPress={action.onPress}
            variant={action.variant ?? 'primary'}
            style={styles.action}
          />
        )}
      </View>
    );
  }
);
EmptyState.displayName = 'EmptyState';
