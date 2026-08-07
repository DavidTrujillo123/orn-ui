import React, { memo } from 'react';
import { Text, TouchableOpacity, View, type StyleProp, type ViewStyle } from 'react-native';
import { createStyles } from '../theme/createStyles';
import { useAllowFontScaling, useColors } from '../theme/UIProvider';
import { Icon } from '../icons/Icon';

export interface StepItem {
  label: string;
  description?: string;
}

export type StepStatus = 'completed' | 'current' | 'pending';

export interface StepsProps {
  steps: StepItem[];
  /** Índice del paso actual (0-based). Los anteriores quedan 'completed'. */
  current: number;
  /** @default 'horizontal' */
  orientation?: 'horizontal' | 'vertical';
  /**
   * Qué muestra el círculo de un paso ya completado: un check, o su número.
   * @default 'check'
   */
  completedIndicator?: 'check' | 'number';
  /** Si se pasa, cada paso es tocable y reporta su índice. */
  onStepPress?: (index: number) => void;
  style?: StyleProp<ViewStyle>;
}

const CIRCLE = 32;

const useStyles = createStyles((theme) => ({
  rowContainer: { flexDirection: 'row', alignItems: 'flex-start' },
  columnContainer: { flexDirection: 'column' },

  // horizontal
  hStep: { flex: 1, alignItems: 'center', gap: theme.tokens.spacing.sm },
  hLabels: { alignItems: 'center', gap: 2, paddingHorizontal: 4 },
  // El conector toma una fracción chica del ancho: compitiendo de igual a
  // igual con los pasos (flex: 1) cada etiqueta se quedaba con 1/(2n-1) del
  // total y RN partía palabras a la mitad ("Paymen / t"). Con 0.3 un flujo de
  // 4 pasos deja ~68px por etiqueta, suficiente para una palabra corriente.
  hConnector: { height: 2, flex: 0.3, marginTop: CIRCLE / 2 - 1 },

  // vertical
  vStep: { flexDirection: 'row', gap: theme.tokens.spacing.md },
  vIndicatorColumn: { alignItems: 'center' },
  vConnector: { width: 2, flex: 1, minHeight: 20, marginVertical: 4 },
  vLabels: { flex: 1, gap: 2, paddingBottom: theme.tokens.spacing.lg },

  circle: {
    width: CIRCLE,
    height: CIRCLE,
    borderRadius: CIRCLE / 2,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleNumber: { fontSize: theme.tokens.fontSize.md, fontWeight: theme.tokens.fontWeight.semibold },
  label: { fontSize: theme.tokens.fontSize.md, fontWeight: theme.tokens.fontWeight.semibold, color: theme.colors.text },
  labelCentered: { textAlign: 'center' },
  description: { fontSize: theme.tokens.fontSize.sm, color: theme.colors.textLight },
  descriptionCentered: { textAlign: 'center' },
}));

function statusOf(index: number, current: number): StepStatus {
  if (index < current) return 'completed';
  if (index === current) return 'current';
  return 'pending';
}

/**
 * Steps
 * Indicador de progreso multi-paso. Base visual de `Wizard`, pero utilizable
 * suelto para mostrar el avance de un flujo que se navega de otra forma.
 */
export const Steps = memo(
  ({ steps, current, orientation = 'horizontal', completedIndicator = 'check', onStepPress, style }: StepsProps) => {
    const colors = useColors();
    const styles = useStyles();
    const allowFontScaling = useAllowFontScaling();
    const isVertical = orientation === 'vertical';

    const colorsFor = (status: StepStatus) => {
      if (status === 'completed') return { bg: colors.primary, border: colors.primary, fg: colors.onPrimary };
      if (status === 'current') return { bg: 'transparent', border: colors.primary, fg: colors.primaryText };
      return { bg: 'transparent', border: colors.border, fg: colors.textLight };
    };

    const renderCircle = (index: number, status: StepStatus) => {
      const c = colorsFor(status);
      const showCheck = status === 'completed' && completedIndicator === 'check';
      return (
        <View style={[styles.circle, { backgroundColor: c.bg, borderColor: c.border }]}>
          {showCheck ? (
            <Icon name="check" size={18} color={c.fg} />
          ) : (
            <Text allowFontScaling={allowFontScaling} style={[styles.circleNumber, { color: c.fg }]}>
              {index + 1}
            </Text>
          )}
        </View>
      );
    };

    const renderLabels = (step: StepItem, status: StepStatus, centered: boolean) => (
      <View style={centered ? styles.hLabels : styles.vLabels}>
        <Text
          allowFontScaling={allowFontScaling}
          style={[
            styles.label,
            centered && styles.labelCentered,
            status === 'pending' && { color: colors.textLight },
          ]}
        >
          {step.label}
        </Text>
        {!!step.description && (
          <Text
            allowFontScaling={allowFontScaling}
            style={[styles.description, centered && styles.descriptionCentered]}
          >
            {step.description}
          </Text>
        )}
      </View>
    );

    const stepAccessibility = (index: number, step: StepItem, status: StepStatus) => ({
      accessibilityRole: (onStepPress ? 'button' : 'text') as 'button' | 'text',
      accessibilityLabel: `Step ${index + 1}: ${step.label}`,
      accessibilityState: { selected: status === 'current', disabled: false },
    });

    if (isVertical) {
      return (
        <View style={[styles.columnContainer, style]}>
          {steps.map((step, index) => {
            const status = statusOf(index, current);
            const isLast = index === steps.length - 1;
            const Wrapper: any = onStepPress ? TouchableOpacity : View;
            return (
              <Wrapper
                key={step.label}
                style={styles.vStep}
                onPress={onStepPress ? () => onStepPress(index) : undefined}
                activeOpacity={0.7}
                {...stepAccessibility(index, step, status)}
              >
                <View style={styles.vIndicatorColumn}>
                  {renderCircle(index, status)}
                  {!isLast && (
                    <View
                      style={[
                        styles.vConnector,
                        { backgroundColor: index < current ? colors.primary : colors.border },
                      ]}
                    />
                  )}
                </View>
                {renderLabels(step, status, false)}
              </Wrapper>
            );
          })}
        </View>
      );
    }

    return (
      <View style={[styles.rowContainer, style]}>
        {steps.map((step, index) => {
          const status = statusOf(index, current);
          const isLast = index === steps.length - 1;
          const Wrapper: any = onStepPress ? TouchableOpacity : View;
          return (
            <React.Fragment key={step.label}>
              <Wrapper
                style={styles.hStep}
                onPress={onStepPress ? () => onStepPress(index) : undefined}
                activeOpacity={0.7}
                {...stepAccessibility(index, step, status)}
              >
                {renderCircle(index, status)}
                {renderLabels(step, status, true)}
              </Wrapper>
              {!isLast && (
                <View
                  style={[styles.hConnector, { backgroundColor: index < current ? colors.primary : colors.border }]}
                />
              )}
            </React.Fragment>
          );
        })}
      </View>
    );
  }
);
Steps.displayName = 'Steps';
