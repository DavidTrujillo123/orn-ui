import React, { memo } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { Button } from '../atoms/Button';
import type { IconName } from '../icons/types';
import { useLabels } from '../theme/UIProvider';
import { createStyles } from '../theme/createStyles';

export interface FormActionsProps {
  /** Label of the main action ("Save"). The primary button shows only with both this and `onPrimaryPress`. */
  primaryLabel?: string;
  /** Main action. */
  onPrimaryPress?: () => void;
  /** Blocks the main action, e.g. while the form is invalid. @default false */
  primaryDisabled?: boolean;
  /**
   * The main action is running: shows a spinner and ignores presses, so it
   * can't be sent twice. The secondary button stays usable. @default false
   */
  primaryLoading?: boolean;
  /** Icon before the primary label. */
  primaryLeftIconName?: IconName;
  /** Label of the ghost button. @default labels.close */
  secondaryLabel?: string;
  /** Close / cancel action. */
  onSecondaryPress: () => void;
  style?: StyleProp<ViewStyle>;
  /** Root testID; the buttons get `<testID>-primary` and `<testID>-secondary`. */
  testID?: string;
}

const useStyles = createStyles((theme) => ({
  root: { gap: theme.tokens.spacing.md },
}));

/**
 * FormActions
 * Pair of buttons: a primary one (save/edit) and a ghost one (close/cancel).
 * Typical use: at the end of a form, or in a Modal's footer.
 *
 * Gestalt, proximity: both buttons sit close together and apart from the
 * fields, so they read as the form's closing actions. Von Restorff: only the
 * primary is filled; the secondary is ghost, so the main path is obvious and
 * the two never compete (Hick: one clear choice). Fitts: full width, primary
 * first, closest to the content it acts on.
 */
export const FormActions = memo(
  ({
    primaryLabel,
    onPrimaryPress,
    primaryDisabled = false,
    primaryLoading = false,
    primaryLeftIconName,
    secondaryLabel,
    onSecondaryPress,
    style,
    testID,
  }: FormActionsProps) => {
    const labels = useLabels();
    const styles = useStyles();
    return (
      <View style={[styles.root, style]} testID={testID}>
        {!!primaryLabel && !!onPrimaryPress && (
          <Button
            title={primaryLabel}
            onPress={onPrimaryPress}
            disabled={primaryDisabled}
            loading={primaryLoading}
            leftIconName={primaryLeftIconName}
            testID={testID && `${testID}-primary`}
          />
        )}
        <Button
          title={secondaryLabel ?? labels.close}
          onPress={onSecondaryPress}
          variant="ghost"
          testID={testID && `${testID}-secondary`}
        />
      </View>
    );
  }
);
FormActions.displayName = 'FormActions';
