import React, { memo } from 'react';
import { Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { createStyles } from '../theme/createStyles';
import { useAllowFontScaling, useColors } from '../theme/UIProvider';
import { Icon } from '../icons/Icon';
import type { IconName } from '../icons/types';
import { Avatar } from '../atoms/Avatar';

export interface InfoRowProps {
  /** Icon that identifies the kind of data at a glance (decorative for screen readers). */
  icon: IconName;
  /** What the value is ("Email", "Address"). */
  label: string;
  /** The data itself. Empty, `null` or `undefined` shows `placeholder`. */
  value: string | null | undefined;
  /** Text shown, in italics, when there is no value ("No phone number"). */
  placeholder: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const ICON_BADGE = 40;
const ICON_SIZE = 20;

const useStyles = createStyles((theme) => ({
  row: { flexDirection: 'row', alignItems: 'center', gap: theme.tokens.spacing.md },
  textContainer: { flex: 1 },
  label: {
    fontSize: theme.tokens.fontSize.sm,
    lineHeight: theme.tokens.lineHeight.sm,
    color: theme.colors.textLight,
    marginBottom: theme.tokens.spacing.xxs,
  },
  value: {
    fontSize: theme.tokens.fontSize.md,
    lineHeight: theme.tokens.lineHeight.md,
    color: theme.colors.text,
    fontWeight: theme.tokens.fontWeight.medium,
  },
  placeholder: { color: theme.colors.textLight, fontStyle: 'italic', fontWeight: theme.tokens.fontWeight.regular },
}));

/**
 * InfoRow
 * Circular icon on the left + stacked label/value on the right. Shows
 * `placeholder` in italics when there is no value. Meant for detail modals.
 *
 * Gestalt, proximity: label and value sit 2pt apart and the icon a token
 * further, so each row reads as one fact; stack rows with a larger gap.
 * Similarity: every label shares the small muted style and every value the
 * strong one, so a list of rows scans by column. A missing value changes
 * style (muted italics) so it can't be mistaken for data.
 *
 * Accessibility: the row is a single element ("Email, jane@example.com");
 * the icon is decorative.
 */
export const InfoRow = memo(({ icon, label, value, placeholder, style, testID }: InfoRowProps) => {
  const colors = useColors();
  const styles = useStyles();
  const allowFontScaling = useAllowFontScaling();
  const shown = value || placeholder;

  return (
    <View style={[styles.row, style]} accessible accessibilityLabel={`${label}, ${shown}`} testID={testID}>
      <Avatar size={ICON_BADGE} backgroundColor={colors.inputBackground}>
        <Icon name={icon} size={ICON_SIZE} color={colors.textLight} />
      </Avatar>
      <View style={styles.textContainer}>
        <Text allowFontScaling={allowFontScaling} style={styles.label}>
          {label}
        </Text>
        <Text allowFontScaling={allowFontScaling} style={[styles.value, !value && styles.placeholder]}>
          {shown}
        </Text>
      </View>
    </View>
  );
});
InfoRow.displayName = 'InfoRow';
