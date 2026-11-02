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
  // Two texts: aligned on the first line, so a value that wraps onto
  // several lines still reads next to its label.
  rowText: { alignItems: 'baseline' },
  // The label keeps its natural width up to half the row; the value
  // shrinks and wraps instead of pushing the row off the screen.
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
    // Fixed-width digits: in a column of amounts the figures line up
    // across rows.
    fontVariant: ['tabular-nums'],
  },
}));

const isPrimitive = (node: React.ReactNode): node is string | number =>
  typeof node === 'string' || typeof node === 'number';

/**
 * KeyValueRow
 * Label (left) / value (right) row. If label/value are a string or number,
 * they render with the default style; if they already come wrapped in a
 * custom component, they are kept as is.
 *
 * Gestalt, alignment and similarity: labels share color and weight and values
 * align to the right edge with tabular digits, so a stack of rows reads as
 * two columns — what on the left, how much on the right.
 * With a text label and value, the row is a single accessibility node
 * ("Subtotal, $300.00"); if either is a custom node (a Badge, a button) it
 * isn't merged, so as not to hide what that node announces or lets you tap.
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
