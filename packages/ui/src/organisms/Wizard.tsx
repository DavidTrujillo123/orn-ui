import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, ScrollView, View, type StyleProp, type ViewStyle } from 'react-native';
import { createStyles } from '../theme/createStyles';
import { KeyboardHandled } from '../theme/KeyboardAvoidance';
import { Steps, type StepItem } from '../molecules/Steps';
import { Button } from '../atoms/Button';
import { Transition } from '../atoms/Transition';

export interface WizardStep extends StepItem {
  content: React.ReactNode;
  /** `false` blocks advancing from this step (validation). @default true */
  canGoNext?: boolean;
}

export interface WizardProps {
  /** The steps, in order: label, optional description, content and `canGoNext`. */
  steps: WizardStep[];
  /** Current step (controlled). If omitted, the Wizard manages its own state. */
  current?: number;
  /** Called with the new index when the step changes (Back, Next or a tap on the indicator). */
  onStepChange?: (index: number) => void;
  /** Called when the finish button is pressed on the last step. */
  onFinish?: () => void;
  /** Layout of the step indicator: a row or a column. @default 'horizontal' */
  orientation?: 'horizontal' | 'vertical';
  /** What the circle of a completed step shows: a check, or its number. @default 'check' */
  completedIndicator?: 'check' | 'number';
  /** Allows returning to an already-completed step by tapping it in the indicator. @default true */
  allowStepNavigation?: boolean;
  /** Text of the back button (hidden on the first step). @default 'Back' */
  backLabel?: string;
  /** Text of the next button. @default 'Next' */
  nextLabel?: string;
  /** Text of the next button on the last step. @default 'Finish' */
  finishLabel?: string;
  /**
   * The step content scrolls when it doesn't fit. Set to false only if
   * a step renders its own virtualized list (nesting a
   * VirtualizedList inside a ScrollView breaks virtualization).
   * @default true
   */
  scrollableContent?: boolean;
  /**
   * The step content slides in following the navigation direction.
   * Only opacity and transform, so the animation runs on the native thread.
   * @default true
   */
  animated?: boolean;
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
 * Multi-step flow: indicator (Steps) + content of the current step +
 * navigation bar. Works controlled (`current` + `onStepChange`) or on its
 * own. `canGoNext: false` on a step disables moving forward, which is where
 * that step's form validation hooks in.
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
  animated = true,
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

  // The ref still holds the previous step during the render that brings the new one.
  const previous = useRef(current);
  const forward = current >= previous.current;
  const entered = useRef(false);
  useEffect(() => {
    previous.current = current;
    entered.current = true;
  }, [current]);

  const activeStep = steps[current];
  const isFirst = current === 0;
  const isLast = current === steps.length - 1;
  const canGoNext = activeStep?.canGoNext !== false;

  const handleNext = () => {
    if (isLast) onFinish?.();
    else goTo(current + 1);
  };

  // The outgoing step isn't animated: keeping both mounted at once would
  // duplicate the forms and their state.
  const renderContent = () =>
    animated ? (
      <Transition
        key={current}
        testID="wizard-step"
        preset={['fade', forward ? 'slide-left' : 'slide-right']}
        appear={entered.current}
      >
        {activeStep?.content}
      </Transition>
    ) : (
      activeStep?.content
    );

  return (
    <View style={[styles.container, style]}>
      <Steps
        steps={stepItems}
        current={current}
        orientation={orientation}
        completedIndicator={completedIndicator}
        // You can only go back by tapping the indicator; jumping forward
        // would skip the validation of the steps in between.
        onStepPress={allowStepNavigation ? (index) => index < current && goTo(index) : undefined}
      />

      {/* The content scrolls instead of overflowing: with the keyboard open a
          long form ate the footer and the buttons ended up painted over the
          fields. */}
      {scrollableContent ? (
        <ScrollView
          testID="wizard-content"
          style={styles.content}
          contentContainerStyle={styles.contentInner}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets
          showsVerticalScrollIndicator={false}
        >
          {/* iOS: the ScrollView already lifts the field (automaticallyAdjustKeyboardInsets).
              Android doesn't have that prop: there the root host handles it. */}
          {Platform.OS === 'ios' ? <KeyboardHandled>{renderContent()}</KeyboardHandled> : renderContent()}
        </ScrollView>
      ) : (
        <View style={styles.content}>{renderContent()}</View>
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
