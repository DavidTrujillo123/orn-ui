import React, { memo } from 'react';
import { Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { createStyles } from '../theme/createStyles';
import { useAllowFontScaling, useColors } from '../theme/UIProvider';
import { Icon } from '../icons/Icon';
import { PressableScale } from '../atoms/PressableScale';
import type { IconName } from '../icons/types';

export interface OptionCardProps {
  /** Name of the option. It is also the start of its accessible name. */
  label: string;
  /**
   * Secondary line: the detail that decides the choice ("arrives in 3 days").
   * Screen readers read it right after the label, not as a hint, because
   * hints can be turned off and this detail is part of the choice.
   */
  description?: string;
  /** Icon that helps recognize the option. Avoid `check`: it reads as "selected". */
  iconName?: IconName;
  /** Whether this is the chosen option of its group. */
  isSelected: boolean;
  /** Called on press; the group decides which option is selected. */
  onPress: () => void;
  /** Dims the card and ignores presses. @default false */
  disabled?: boolean;
  /** 'vertical': icon on top, text centered below. 'horizontal': in a row. @default 'horizontal' */
  layout?: 'vertical' | 'horizontal';
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const ICON_SIZE = 24;
/** Same height for every vertical card in a row, even with a short label. */
const VERTICAL_MIN_HEIGHT = 100;
const DISABLED_OPACITY = 0.5;
/** The selected border is thicker; its padding gives back the difference so content doesn't shift. */
const BORDER = 1;
const BORDER_SELECTED = 1.5;

const useStyles = createStyles((theme) => ({
  card: {
    // The cards share whatever row contains them, whether two or five.
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    // Raised: in dark it stays a visible tile on a surface (Card does the same).
    backgroundColor: theme.colors.surfaceRaised,
    borderRadius: theme.tokens.radius.md,
    borderWidth: BORDER,
    borderColor: theme.colors.border,
    padding: theme.tokens.spacing.md,
    ...theme.tokens.shadow.sm,
  },
  cardHorizontal: { flexDirection: 'row', gap: theme.tokens.spacing.sm },
  cardVertical: { gap: theme.tokens.spacing.sm, minHeight: VERTICAL_MIN_HEIGHT },
  cardSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primarySoft,
    borderWidth: BORDER_SELECTED,
    padding: theme.tokens.spacing.md - (BORDER_SELECTED - BORDER),
    elevation: 0,
    shadowOpacity: 0,
  },
  cardDisabled: { opacity: DISABLED_OPACITY },
  text: { flexShrink: 1 },
  textVertical: { alignItems: 'center' },
  label: {
    color: theme.colors.text,
    fontSize: theme.tokens.fontSize.md,
    lineHeight: theme.tokens.lineHeight.md,
    fontWeight: theme.tokens.fontWeight.medium,
  },
  labelVertical: { textAlign: 'center' },
  labelSelected: { color: theme.colors.primaryText },
  description: {
    fontSize: theme.tokens.fontSize.sm,
    lineHeight: theme.tokens.lineHeight.sm,
    color: theme.colors.textLight,
    marginTop: theme.tokens.spacing.xxs,
  },
  descriptionVertical: { textAlign: 'center' },
}));

/**
 * OptionCard
 * Mutually exclusive option with an icon and label that highlights when
 * `isSelected`. It is a radio with a card's face, so it announces itself as
 * one: wrap the group in a View with `accessibilityRole="radiogroup"` so the
 * screen reader reads "1 of 3".
 *
 * Gestalt, similarity: every card in a group shares shape, size and type, so
 * they read as alternatives of one question. Von Restorff / figure-ground: the
 * selected one is the only filled card with an accent border and no shadow —
 * it stands out without the others losing legibility (their labels keep the
 * `text` color). The thicker selected border doesn't move the content.
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
        accessibilityLabel={description ? `${label}, ${description}` : label}
        testID={testID}
      >
        {!!iconName && <Icon name={iconName} size={ICON_SIZE} color={isSelected ? colors.primary : colors.textLight} />}

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
