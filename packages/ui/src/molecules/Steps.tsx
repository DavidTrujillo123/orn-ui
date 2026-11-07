import React, { memo, useEffect, useRef, useState } from 'react';
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useReduceMotion } from '../theme/useReduceMotion';
import { createStyles } from '../theme/createStyles';
import { useAllowFontScaling, useColors, useLabels } from '../theme/UIProvider';
import { Icon } from '../icons/Icon';

export interface StepItem {
  /** Short name of the step ("Payment"). */
  label: string;
  /** Optional second line with a detail ("Card or cash"). */
  description?: string;
}

export type StepStatus = 'completed' | 'current' | 'pending';

export interface StepsProps {
  /** The sequence, in order. */
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
  /** Root testID; each step gets `<testID>-<index>`. */
  testID?: string;
}

const CIRCLE = 32;
const CIRCLE_BORDER = 2;
const CHECK_SIZE = 18;
const CONNECTOR = 2;
/** Minimum width of a horizontal column: below it, labels break mid-word. */
const STEP_MIN_WIDTH = 76;
/** Share of the row a horizontal connector takes next to a step (flex: 1). */
const CONNECTOR_FLEX = 0.3;
const PRESSED_OPACITY = 0.7;

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
  hLabels: { alignItems: 'center', gap: theme.tokens.spacing.xxs, paddingHorizontal: theme.tokens.spacing.xs },
  // The connector takes a small fraction of the width: competing on equal
  // terms with the steps (flex: 1), each label ended up with 1/(2n-1) of the
  // total.
  hConnector: {
    height: CONNECTOR,
    flex: CONNECTOR_FLEX,
    minWidth: theme.tokens.spacing.md,
    marginTop: CIRCLE / 2 - CONNECTOR / 2,
  },
  hLabel: { fontSize: theme.tokens.fontSize.sm, lineHeight: theme.tokens.lineHeight.sm },
  hDescription: { fontSize: theme.tokens.fontSize.xs, lineHeight: theme.tokens.lineHeight.sm },

  // vertical
  vStep: { flexDirection: 'row', gap: theme.tokens.spacing.md },
  vIndicatorColumn: { alignItems: 'center' },
  vConnector: { width: CONNECTOR, flex: 1, minHeight: theme.tokens.spacing.xl, marginVertical: theme.tokens.spacing.xs },
  vLabels: { flex: 1, gap: theme.tokens.spacing.xxs, paddingBottom: theme.tokens.spacing.lg },
  // The last step has no connector below: no trailing space either.
  vLabelsLast: { paddingBottom: 0 },

  circle: {
    width: CIRCLE,
    height: CIRCLE,
    borderRadius: CIRCLE / 2,
    borderWidth: CIRCLE_BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleNumber: { fontSize: theme.tokens.fontSize.md, fontWeight: theme.tokens.fontWeight.semibold },
  label: {
    fontSize: theme.tokens.fontSize.md,
    lineHeight: theme.tokens.lineHeight.md,
    fontWeight: theme.tokens.fontWeight.semibold,
    color: theme.colors.text,
  },
  labelCurrent: { color: theme.colors.primaryText },
  labelPending: { color: theme.colors.textLight, fontWeight: theme.tokens.fontWeight.medium },
  labelCentered: { textAlign: 'center' },
  description: { fontSize: theme.tokens.fontSize.sm, lineHeight: theme.tokens.lineHeight.sm, color: theme.colors.textLight },
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
 *
 * Gestalt, continuity: a connector line runs through the circles, so the steps
 * read as one path; the stretch already walked is filled with the accent.
 * Similarity: every step is the same circle + label, and the state only
 * changes fill and color (done = filled, current = outlined accent, pending =
 * grey). Von Restorff: the current step is the only accent-colored label.
 *
 * Accessibility: each step announces "Step 2 of 3: Payment, current", with
 * every word from `labels`.
 */
export const Steps = memo(
  ({
    steps,
    current,
    orientation = 'horizontal',
    completedIndicator = 'check',
    onStepPress,
    style,
    testID,
  }: StepsProps) => {
    const colors = useColors();
    const labels = useLabels();
    const styles = useStyles();
    const allowFontScaling = useAllowFontScaling();
    const isVertical = orientation === 'vertical';
    const reduceMotion = useReduceMotion();

    // Horizontal overflow: when the steps don't fit, the row scrolls. A hidden
    // step gave no hint of existing, so the current step is brought into view
    // and the scroll bar flashes once (visibility of system status).
    const scrollRef = useRef<ScrollView>(null);
    const [viewportWidth, setViewportWidth] = useState(0);
    const [contentWidth, setContentWidth] = useState(0);
    const stepX = useRef<number[]>([]);
    const overflows = !isVertical && viewportWidth > 0 && contentWidth > viewportWidth + 1;

    useEffect(() => {
      if (!overflows) return;
      const x = stepX.current[current] ?? 0;
      // A quarter of the row of lead-in: the previous step stays partly visible.
      scrollRef.current?.scrollTo({ x: Math.max(0, x - viewportWidth / 4), animated: !reduceMotion });
      scrollRef.current?.flashScrollIndicators();
    }, [overflows, current, viewportWidth, reduceMotion]);

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
            <Icon name="check" size={CHECK_SIZE} color={c.fg} />
          ) : (
            <Text allowFontScaling={allowFontScaling} style={[styles.circleNumber, { color: c.fg }]}>
              {index + 1}
            </Text>
          )}
        </View>
      );
    };

    const renderLabels = (step: StepItem, status: StepStatus, centered: boolean, isLast = false) => (
      <View style={centered ? styles.hLabels : [styles.vLabels, isLast && styles.vLabelsLast]}>
        <Text
          allowFontScaling={allowFontScaling}
          style={[
            styles.label,
            centered && styles.labelCentered,
            centered && styles.hLabel,
            status === 'current' && styles.labelCurrent,
            status === 'pending' && styles.labelPending,
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

    const statusLabel = { completed: labels.stepCompleted, current: labels.stepCurrent, pending: labels.stepPending };
    const stepAccessibility = (index: number, step: StepItem, status: StepStatus) => ({
      accessibilityRole: (onStepPress ? 'button' : 'text') as 'button' | 'text',
      accessibilityLabel: `${labels.stepOf
        .replace('{n}', String(index + 1))
        .replace('{total}', String(steps.length))
        .replace('{label}', step.label)}, ${statusLabel[status]}`,
      accessibilityState: { selected: status === 'current', disabled: false },
      testID: testID && `${testID}-${index}`,
    });

    if (isVertical) {
      return (
        <View style={[styles.columnContainer, style]} testID={testID}>
          {steps.map((step, index) => {
            const status = statusOf(index, current);
            const isLast = index === steps.length - 1;
            const Wrapper = onStepPress ? TouchableOpacity : View;
            // Only touchable when there is onStepPress: passing onPress/activeOpacity
            // to a plain View doesn't crash, but leaves them as silent noise.
            const interactiveProps = onStepPress
              ? { onPress: () => onStepPress(index), activeOpacity: PRESSED_OPACITY }
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
                {renderLabels(step, status, false, isLast)}
              </Wrapper>
            );
          })}
        </View>
      );
    }

    return (
      <ScrollView
        ref={scrollRef}
        testID={testID}
        horizontal
        showsHorizontalScrollIndicator={overflows}
        onLayout={(e: LayoutChangeEvent) => setViewportWidth(e.nativeEvent.layout.width)}
        onContentSizeChange={(width: number) => setContentWidth(width)}
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
            ? { onPress: () => onStepPress(index), activeOpacity: PRESSED_OPACITY }
            : undefined;
          return (
            <React.Fragment key={`${step.label}-${index}`}>
              <Wrapper
                style={styles.hStep}
                onLayout={(e: LayoutChangeEvent) => {
                  stepX.current[index] = e.nativeEvent.layout.x;
                }}
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
