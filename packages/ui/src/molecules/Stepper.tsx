import React, { memo, useRef, useState, type ComponentRef } from 'react';
import {
  TextInput,
  TouchableOpacity,
  View,
  type AccessibilityActionEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { createStyles } from '../theme/createStyles';
import { useAllowFontScaling, useColors, useLabels, useTheme } from '../theme/UIProvider';
import { useKeyboardField } from '../theme/useKeyboardField';
import { Icon } from '../icons/Icon';

export type StepperSize = 'sm' | 'md' | 'lg';

export interface StepperProps {
  /** Current value, as text (it may be mid-typing, e.g. "" or "1."). */
  value: string;
  /** Receives the cleaned-up text while typing, and the clamped value on blur. */
  onChangeText: (text: string) => void;
  /** "+" pressed (or swipe up with a screen reader). Do the arithmetic here. */
  onIncrement: () => void;
  /** "-" pressed (or swipe down with a screen reader). */
  onDecrement: () => void;
  /** Scale of the control: height, buttons, icon and typography. @default 'md' */
  size?: StepperSize;
  /** Takes up all available width and the input absorbs the extra space. @default false */
  block?: boolean;
  /**
   * When false the value can only be changed with the buttons: the keyboard doesn't open and
   * the field loses the background that marks it as editable. @default true
   */
  editable?: boolean;
  /**
   * Minimum allowed value. Disables "-" when reached and clamps the typed value on
   * blur. Negative values are only accepted if `min` is negative.
   */
  min?: number;
  /** Maximum allowed value. Disables "+" when reached and clamps the typed value. */
  max?: number;
  /** Accepts a decimal separator, normalizing comma to dot. @default false */
  allowDecimals?: boolean;
  style?: StyleProp<ViewStyle>;
  /** Accessible name of the numeric field. @default labels.quantity */
  accessibilityLabel?: string;
  /** Accessible name of the "+" button. @default labels.increment */
  incrementAccessibilityLabel?: string;
  /** Accessible name of the "-" button. @default labels.decrement */
  decrementAccessibilityLabel?: string;
  testID?: string;
}

const SIZES: Record<StepperSize, { height: number; icon: number; inputWidth: number }> = {
  sm: { height: 36, icon: 18, inputWidth: 48 },
  md: { height: 44, icon: 20, inputWidth: 56 },
  lg: { height: 52, icon: 22, inputWidth: 64 },
};

/** Minimum touch target (Fitts): smaller buttons reach it with hitSlop. */
const MIN_TOUCH = 44;

const ADJUST_ACTIONS = [
  { name: 'increment' as const },
  { name: 'decrement' as const },
];

const useStyles = createStyles((theme) => ({
  control: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.tokens.radius.md,
  },
  controlBlock: { alignSelf: 'stretch' },
  btn: { height: '100%', justifyContent: 'center', alignItems: 'center' },
  input: {
    textAlign: 'center',
    height: '100%',
    color: theme.colors.text,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: theme.colors.border,
  },
  // The background tells the field apart from a read-only value: it is the
  // only hint that you can type there before touching it.
  editable: { backgroundColor: theme.colors.inputBackground },
}));

/** Keeps only what can be part of a number allowed by the range. */
export function sanitizeNumeric(text: string, { allowDecimals = false, allowNegative = false } = {}): string {
  const normalized = allowDecimals ? text.replace(',', '.') : text;
  const negative = allowNegative && normalized.trimStart().startsWith('-');
  const digits = normalized.replace(allowDecimals ? /[^0-9.]/g : /[^0-9]/g, '');
  const [whole = '', ...decimals] = digits.split('.');
  const body = decimals.length > 0 ? `${whole}.${decimals.join('')}` : whole;
  return negative ? `-${body}` : body;
}

/**
 * Stepper
 * "-" button + editable numeric input + "+" button. `size` controls only the
 * scale and `block` only the width, so both axes combine freely.
 *
 * The component doesn't do the buttons' arithmetic —that lives in
 * `onIncrement`/`onDecrement`—, but it does clean up what is typed and signals
 * when the value hit an end of the range by disabling the button that would pass it.
 *
 * Gestalt, common region: the three parts share one border, so they read as a
 * single control; the field is set apart by its fill (it can be typed into).
 * Fitts: every button reaches 44pt, `sm` through hitSlop.
 *
 * Accessibility: the field is an adjustable element — VoiceOver/TalkBack users
 * swipe up/down to step the value — and every name comes from `labels`. Like
 * Input, it stays visible above the keyboard while typing.
 */
export const Stepper = memo(
  ({
    value,
    onChangeText,
    onIncrement,
    onDecrement,
    size = 'md',
    block = false,
    editable = true,
    min,
    max,
    allowDecimals = false,
    style,
    accessibilityLabel,
    incrementAccessibilityLabel,
    decrementAccessibilityLabel,
    testID,
  }: StepperProps) => {
    const theme = useTheme();
    const colors = useColors();
    const styles = useStyles();
    const labels = useLabels();
    const allowFontScaling = useAllowFontScaling();
    const [focused, setFocused] = useState(false);
    const controlRef = useRef<ComponentRef<typeof View>>(null);
    const keyboard = useKeyboardField(controlRef);

    const { height, icon, inputWidth } = SIZES[size];
    const fontSize =
      size === 'sm' ? theme.tokens.fontSize.md : size === 'md' ? theme.tokens.fontSize.lg : theme.tokens.fontSize.xl;
    const slopV = Math.max(0, (MIN_TOUCH - height) / 2);
    const hitSlop = slopV > 0 ? { top: slopV, bottom: slopV, left: slopV, right: slopV } : undefined;

    const allowNegative = min !== undefined && min < 0;
    const numeric = Number(value);
    const isNumber = value.trim() !== '' && Number.isFinite(numeric);
    const atMin = isNumber && min !== undefined && numeric <= min;
    const atMax = isNumber && max !== undefined && numeric >= max;

    const handleChangeText = (text: string) => {
      onChangeText(sanitizeNumeric(text, { allowDecimals, allowNegative }));
    };

    // Clamping to the range waits for blur: doing it while typing makes it
    // impossible to reach "12" when the minimum is 5, because the "1" would
    // already be corrected.
    const handleBlur = () => {
      setFocused(false);
      keyboard.blur();
      if (!isNumber) return;
      const clamped = Math.min(max ?? numeric, Math.max(min ?? numeric, numeric));
      if (clamped !== numeric) onChangeText(String(clamped));
    };

    const handleAccessibilityAction = (e: AccessibilityActionEvent) => {
      if (e.nativeEvent.actionName === 'increment' && !atMax) onIncrement();
      if (e.nativeEvent.actionName === 'decrement' && !atMin) onDecrement();
    };

    const stepButton = (
      direction: 'decrement' | 'increment',
      onPress: () => void,
      disabled: boolean,
      label: string
    ) => (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled}
        hitSlop={hitSlop}
        style={[styles.btn, { width: height }]}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled }}
        testID={testID && `${testID}-${direction}`}
      >
        <Icon
          name={direction === 'increment' ? 'plus' : 'minus'}
          size={icon}
          color={disabled ? colors.textLight : colors.primary}
        />
      </TouchableOpacity>
    );

    return (
      <View
        ref={controlRef}
        testID={testID}
        style={[
          styles.control,
          { height },
          block && styles.controlBlock,
          focused && { borderColor: colors.primary },
          style,
        ]}
      >
        {stepButton('decrement', onDecrement, atMin, decrementAccessibilityLabel ?? labels.decrement)}
        <TextInput
          allowFontScaling={allowFontScaling}
          style={[
            styles.input,
            { fontSize },
            editable && styles.editable,
            focused && { borderColor: colors.primary },
            block ? { flex: 1 } : { width: inputWidth },
          ]}
          value={value}
          onChangeText={handleChangeText}
          onFocus={() => {
            setFocused(true);
            keyboard.focus();
          }}
          onBlur={handleBlur}
          editable={editable}
          keyboardType={allowDecimals ? 'decimal-pad' : 'number-pad'}
          selectTextOnFocus
          accessibilityLabel={accessibilityLabel ?? labels.quantity}
          accessibilityRole="adjustable"
          accessibilityValue={{ text: value }}
          accessibilityActions={ADJUST_ACTIONS}
          onAccessibilityAction={handleAccessibilityAction}
        />
        {stepButton('increment', onIncrement, atMax, incrementAccessibilityLabel ?? labels.increment)}
      </View>
    );
  }
);
Stepper.displayName = 'Stepper';
