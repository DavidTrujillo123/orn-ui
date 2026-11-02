import React, { memo } from 'react';
import { ScrollView, Text, TouchableOpacity, View, type StyleProp, type ViewStyle } from 'react-native';
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
  /** Index of the current step (0-based). Earlier steps become 'completed'. */
  current: number;
  /** @default 'horizontal' */
  orientation?: 'horizontal' | 'vertical';
  /**
   * What the circle of an already-completed step shows: a check, or its number.
   * @default 'check'
   */
  completedIndicator?: 'check' | 'number';
  /** If provided, each step is tappable and reports its index. */
  onStepPress?: (index: number) => void;
  style?: StyleProp<ViewStyle>;
}

const CIRCLE = 32;
/** Minimum width of a horizontal column: below it, labels break mid-word. */
const STEP_MIN_WIDTH = 76;

const useStyles = createStyles((theme) => ({
  rowContainer: { flexDirection: 'row', alignItems: 'flex-start' },
  columnContainer: { flexDirection: 'column' },

  // horizontal
  // ScrollView ships with flexGrow: 1 and was eating all the available height
  // of the container, leaving the steps stuck to the top of a huge box.
  hScrollView: { flexGrow: 0, flexShrink: 0 },
  hScroll: { flexGrow: 1, flexDirection: 'row', alignItems: 'flex-start' },
  // `minWidth` is what keeps RN from breaking words in half
  // ("Almacé / n"): rather than squeezing the column below a regular
  // word, the row becomes scrollable.
  hStep: { flex: 1, minWidth: STEP_MIN_WIDTH, alignItems: 'center', gap: theme.tokens.spacing.sm },
  hLabels: { alignItems: 'center', gap: 2, paddingHorizontal: 4 },
  // The connector takes a small fraction of the width: competing on equal
  // terms with the steps (flex: 1), each label ended up with 1/(2n-1) of the
  // total.
  hConnector: { height: 2, flex: 0.3, minWidth: 12, marginTop: CIRCLE / 2 - 1 },
  hLabel: { fontSize: theme.tokens.fontSize.sm },
  hDescription: { fontSize: theme.tokens.fontSize.xs },

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
 * Multi-step progress indicator. The visual base of `Wizard`, but usable on
 * its own to show progress through a flow that is navigated some other way.
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
            centered && styles.hLabel,
            status === 'pending' && { color: colors.textLight },
          ]}
        >
          {step.label}
        </Text>
        {!!step.description && (
          <Text
            allowFontScaling={allowFontScaling}
            style={[styles.description, centered && styles.descriptionCentered, centered && styles.hDescription]}
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
            const Wrapper = onStepPress ? TouchableOpacity : View;
            // Only touchable when there is onStepPress: passing onPress/activeOpacity
            // to a plain View doesn't crash, but leaves them as silent noise.
            const interactiveProps = onStepPress
              ? { onPress: () => onStepPress(index), activeOpacity: 0.7 }
              : undefined;
            return (
              <Wrapper
                key={`${step.label}-${index}`}
                style={styles.vStep}
                {...interactiveProps}
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
      <ScrollView
        testID="steps-row"
        horizontal
        showsHorizontalScrollIndicator={false}
        // With room to spare the steps share the row just like before
        // (flexGrow); when they don't fit, it scrolls instead of squeezing the text.
        style={[styles.hScrollView, style]}
        contentContainerStyle={styles.hScroll}
      >
        {steps.map((step, index) => {
          const status = statusOf(index, current);
          const isLast = index === steps.length - 1;
          const Wrapper = onStepPress ? TouchableOpacity : View;
          const interactiveProps = onStepPress
            ? { onPress: () => onStepPress(index), activeOpacity: 0.7 }
            : undefined;
          return (
            <React.Fragment key={`${step.label}-${index}`}>
              <Wrapper
                style={styles.hStep}
                {...interactiveProps}
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
      </ScrollView>
    );
  }
);
Steps.displayName = 'Steps';
