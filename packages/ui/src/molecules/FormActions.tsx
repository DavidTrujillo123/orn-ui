import React, { memo } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { Button } from '../atoms/Button';
import type { IconName } from '../icons/types';
import { useLabels } from '../theme/UIProvider';

export interface FormActionsProps {
  /** If omitted, only the secondary button is shown. */
  primaryLabel?: string;
  onPrimaryPress?: () => void;
  primaryDisabled?: boolean;
  primaryLoading?: boolean;
  primaryLeftIconName?: IconName;
  secondaryLabel?: string;
  onSecondaryPress: () => void;
  style?: StyleProp<ViewStyle>;
}

/**
 * FormActions
 * Par de botones: uno primario (guardar/editar) y uno ghost (cerrar/cancelar).
 * Uso típico: al final de un form, o en el footer de un Modal.
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
  }: FormActionsProps) => {
    const labels = useLabels();
    return (
      <View style={[{ gap: 12 }, style]}>
        {primaryLabel && onPrimaryPress && (
          <Button
            title={primaryLabel}
            onPress={onPrimaryPress}
            disabled={primaryDisabled}
            loading={primaryLoading}
            leftIconName={primaryLeftIconName}
          />
        )}
        <Button title={secondaryLabel ?? labels.close} onPress={onSecondaryPress} variant="ghost" />
      </View>
    );
  }
);
FormActions.displayName = 'FormActions';
