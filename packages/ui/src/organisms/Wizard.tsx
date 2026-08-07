import React, { useCallback, useMemo, useState } from 'react';
import { ScrollView, View, type StyleProp, type ViewStyle } from 'react-native';
import { createStyles } from '../theme/createStyles';
import { Steps, type StepItem } from '../molecules/Steps';
import { Button } from '../atoms/Button';

export interface WizardStep extends StepItem {
  content: React.ReactNode;
  /** false bloquea el avance desde este paso (validación). @default true */
  canGoNext?: boolean;
}

export interface WizardProps {
  steps: WizardStep[];
  /** Paso actual (controlado). Si se omite, el Wizard maneja su propio estado. */
  current?: number;
  onStepChange?: (index: number) => void;
  onFinish?: () => void;
  /** @default 'horizontal' */
  orientation?: 'horizontal' | 'vertical';
  completedIndicator?: 'check' | 'number';
  /** Permite volver a un paso ya completado tocándolo en el indicador. @default true */
  allowStepNavigation?: boolean;
  backLabel?: string;
  nextLabel?: string;
  finishLabel?: string;
  /**
   * El contenido del paso scrollea cuando no entra. Ponelo en false sólo si
   * un paso renderiza su propia lista virtualizada (anidar una
   * VirtualizedList dentro de un ScrollView rompe la virtualización).
   * @default true
   */
  scrollableContent?: boolean;
  style?: StyleProp<ViewStyle>;
}

const useStyles = createStyles((theme) => ({
  container: { flex: 1, gap: theme.tokens.spacing.xl },
  content: { flex: 1 },
  contentInner: { flexGrow: 1, paddingBottom: theme.tokens.spacing.sm },
  footer: { flexDirection: 'row', gap: theme.tokens.spacing.md },
  footerButton: { flex: 1 },
}));

/**
 * Wizard
 * Flujo multi-paso: indicador (Steps) + contenido del paso actual + barra de
 * navegación. Funciona controlado (`current` + `onStepChange`) o por su
 * cuenta. `canGoNext: false` en un paso deshabilita el avance, que es donde
 * se engancha la validación del formulario de ese paso.
 */
export function Wizard({
  steps,
  current: controlledCurrent,
  onStepChange,
  onFinish,
  orientation = 'horizontal',
  completedIndicator = 'check',
  allowStepNavigation = true,
  backLabel = 'Back',
  nextLabel = 'Next',
  finishLabel = 'Finish',
  scrollableContent = true,
  style,
}: WizardProps) {
  const styles = useStyles();
  const [uncontrolled, setUncontrolled] = useState(0);
  const isControlled = controlledCurrent !== undefined;
  const current = isControlled ? controlledCurrent : uncontrolled;

  const goTo = useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(index, steps.length - 1));
      if (!isControlled) setUncontrolled(clamped);
      onStepChange?.(clamped);
    },
    [isControlled, onStepChange, steps.length]
  );

  const stepItems = useMemo(
    () => steps.map(({ label, description }) => ({ label, description })),
    [steps]
  );

  const activeStep = steps[current];
  const isFirst = current === 0;
  const isLast = current === steps.length - 1;
  const canGoNext = activeStep?.canGoNext !== false;

  const handleNext = () => {
    if (isLast) onFinish?.();
    else goTo(current + 1);
  };

  return (
    <View style={[styles.container, style]}>
      <Steps
        steps={stepItems}
        current={current}
        orientation={orientation}
        completedIndicator={completedIndicator}
        // Sólo se puede volver atrás tocando el indicador; saltar hacia
        // adelante se saltearía la validación de los pasos intermedios.
        onStepPress={allowStepNavigation ? (index) => index < current && goTo(index) : undefined}
      />

      {/* El contenido scrollea en vez de desbordar: con el teclado abierto un
          form largo se comía el footer y los botones quedaban pintados encima
          de los campos. */}
      {scrollableContent ? (
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentInner}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets
          showsVerticalScrollIndicator={false}
        >
          {activeStep?.content}
        </ScrollView>
      ) : (
        <View style={styles.content}>{activeStep?.content}</View>
      )}

      <View style={styles.footer}>
        {!isFirst && (
          <Button title={backLabel} variant="outline" onPress={() => goTo(current - 1)} style={styles.footerButton} />
        )}
        <Button
          title={isLast ? finishLabel : nextLabel}
          onPress={handleNext}
          disabled={!canGoNext}
          style={styles.footerButton}
        />
      </View>
    </View>
  );
}
