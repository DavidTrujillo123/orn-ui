import React, { memo } from 'react';
import { Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { createStyles } from '../theme/createStyles';
import { useAllowFontScaling, useColors } from '../theme/UIProvider';
import { Icon } from '../icons/Icon';
import { PressableScale } from '../atoms/PressableScale';
import type { IconName } from '../icons/types';

export interface OptionCardProps {
  label: string;
  /** Secondary line: the detail that decides the choice ("arrives in 3 days"). */
  description?: string;
  iconName?: IconName;
  isSelected: boolean;
  onPress: () => void;
  disabled?: boolean;
  /** 'vertical': icon on top, text centered below. 'horizontal': in a row. @default 'horizontal' */
  layout?: 'vertical' | 'horizontal';
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const useStyles = createStyles((theme) => ({
  card: {
    // The cards share whatever row contains them, whether two or five.
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.tokens.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.tokens.shadow.sm,
  },
  cardHorizontal: { flexDirection: 'row', padding: theme.tokens.spacing.md - 2, gap: theme.tokens.spacing.sm },
  cardVertical: { padding: theme.tokens.spacing.md - 2, gap: 6, minHeight: 100 },
  cardSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primarySoft,
    borderWidth: 1.5,
    elevation: 0,
    shadowOpacity: 0,
  },
  cardDisabled: { opacity: 0.5 },
  text: { flexShrink: 1 },
  textVertical: { alignItems: 'center' },
  label: { color: theme.colors.textLight, fontWeight: theme.tokens.fontWeight.medium },
  labelVertical: { fontSize: theme.tokens.fontSize.xs, textAlign: 'center' },
  labelSelected: { color: theme.colors.primaryText },
  description: { fontSize: theme.tokens.fontSize.xs, color: theme.colors.textLight, marginTop: 2 },
  descriptionVertical: { textAlign: 'center' },
}));

/**
 * OptionCard
 * Mutually exclusive option with an icon and label that highlights when
 * `isSelected`. It is a radio with a card's face, so it announces itself as
 * one: wrap the group in a View with `accessibilityRole="radiogroup"` so the
 * screen reader reads "1 of 3".
 */
export const OptionCard = memo(
  ({
    label,
    description,
    iconName,
    isSelected,
    onPress,
    disabled = false,
    layout = 'horizontal',
    style,
    testID,
  }: OptionCardProps) => {
    const colors = useColors();
    const styles = useStyles();
    const allowFontScaling = useAllowFontScaling();
    const isVertical = layout === 'vertical';

    // Feedback through transform, not opacity: with elevation, animating opacity
    // triggers an Android bug that redraws the shadow as a dark border.
    return (
      <PressableScale
        style={[
          styles.card,
          isVertical ? styles.cardVertical : styles.cardHorizontal,
          isSelected && styles.cardSelected,
          disabled && styles.cardDisabled,
          style,
        ]}
        onPress={onPress}
        disabled={disabled}
        accessibilityRole="radio"
        accessibilityState={{ selected: isSelected, checked: isSelected, disabled }}
        accessibilityLabel={label}
        accessibilityHint={description}
        testID={testID}
      >
        {!!iconName && <Icon name={iconName} size={24} color={isSelected ? colors.primary : colors.textLight} />}

        <View style={[styles.text, isVertical && styles.textVertical]}>
          <Text
            allowFontScaling={allowFontScaling}
            style={[styles.label, isVertical && styles.labelVertical, isSelected && styles.labelSelected]}
          >
            {label}
          </Text>
          {!!description && (
            <Text
              allowFontScaling={allowFontScaling}
              style={[styles.description, isVertical && styles.descriptionVertical]}
            >
              {description}
            </Text>
          )}
        </View>
      </PressableScale>
    );
  }
);
OptionCard.displayName = 'OptionCard';
