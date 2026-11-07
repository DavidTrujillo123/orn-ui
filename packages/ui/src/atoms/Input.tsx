import React, { forwardRef, memo, useEffect, useImperativeHandle, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  ActivityIndicator,
  Animated,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { createStyles } from '../theme/createStyles';
import { useAllowFontScaling, useColors, useLabels, useTheme } from '../theme/UIProvider';
import { Icon } from '../icons/Icon';
import type { IconName } from '../icons/types';
import { useKeyboardField } from '../theme/useKeyboardField';
import { validateInputValue, type InputRules } from './inputValidation';

export type { InputRules, InputRuleValue } from './inputValidation';

/** The TextInput instance, plus `validate()` to check the field on demand (e.g. on submit). */
export type InputHandle = TextInput & {
  /** Runs the rules, shows the error (if any) and returns it. */
  validate: () => string | undefined;
};

export interface InputProps extends Omit<TextInputProps, 'style'> {
  /** Text above the field; also its accessible name (falls back to `placeholder`). */
  label?: string;
  /** Shows an asterisk next to the label, and an empty value fails validation (`labels.requiredError`). */
  required?: boolean;
  /** Error shown under the field. Takes precedence over the built-in validation. */
  error?: string;
  /** Built-in validation: length limits, a pattern and/or a custom check. */
  rules?: InputRules;
  /**
   * When the rules run: on leaving the field, on every change, or only through
   * `ref.validate()`. Once an error shows, it re-checks on every change so it
   * clears as soon as the value is fixed. @default 'blur'
   */
  validateOn?: 'blur' | 'change' | 'submit';
  /** Called with the error (or undefined) every time the rules run. */
  onValidate?: (error: string | undefined) => void;
  /** Style of the outer wrapper (label, field and error). */
  containerStyle?: StyleProp<ViewStyle>;
  style?: TextInputProps['style'];
  /** Icon shown inside the field, to the left of the text. */
  leftIconName?: IconName;
  /** Icon button inside the field, on the right. Ignored with `isPassword` or `isLoading`. */
  rightIconName?: IconName;
  /** Called when the `rightIconName` button is pressed. Without it the button is disabled. */
  onRightIconPress?: () => void;
  /** Accessible name of the `rightIconName` button. @default labels.clear */
  rightIconAccessibilityLabel?: string;
  /** Hides the text and adds an eye button to show or hide it. @default false */
  isPassword?: boolean;
  /** Shows a small spinner on the right, in place of the right icon. @default false */
  isLoading?: boolean;
}

const useStyles = createStyles((theme) => ({
  container: { marginBottom: theme.tokens.spacing.lg, width: '100%' },
  label: {
    marginBottom: theme.tokens.spacing.sm,
    fontSize: theme.tokens.fontSize.md,
    fontWeight: theme.tokens.fontWeight.medium,
    color: theme.colors.text,
  },
  required: { color: theme.colors.errorText },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.inputBackground,
    borderRadius: theme.tokens.radius.lg,
    borderWidth: 2,
    minHeight: 50,
  },
  input: {
    flex: 1,
    paddingVertical: theme.tokens.spacing.md,
    paddingHorizontal: theme.tokens.spacing.lg,
    fontSize: theme.tokens.fontSize.lg,
    color: theme.colors.text,
  },
  leftIcon: { marginLeft: theme.tokens.spacing.lg, marginRight: -theme.tokens.spacing.xs },
  // 20 icon + md padding (12) per side = 44pt touch area (Fitts).
  rightIcon: { padding: theme.tokens.spacing.md, marginRight: theme.tokens.spacing.xxs },
  // Read-only: no fill, so it doesn't look like a field you can tap
  // (affordance), but the text keeps its contrast to stay readable.
  readOnly: { backgroundColor: 'transparent' },
  errorText: { marginTop: theme.tokens.spacing.xs, fontSize: theme.tokens.fontSize.sm, color: theme.colors.errorText },
}));

/**
 * Input
 * The border animates its color between border/primary/error with Animated
 * (no useNativeDriver: color drivers in RN without Fabric are only reliable
 * on the JS thread; the cost is negligible, it animates one border).
 *
 * Gestalt:
 * - Proximity: label (`spacing.sm` above) and error (`spacing.xs` below) sit
 *   right next to the field and the next field is `spacing.lg` away: each
 *   label and its error read with their field, not with the neighbor.
 * - Common region: left icon, text and right action share the same border
 *   and background, so they read as a single control.
 * - Focal point: the border turns `primary` on focus and `error` on error;
 *   the error is also written out (not just color).
 *
 * Accessibility: the accessible name includes "required" when applicable, the
 * error is announced as a hint, and the eye and right-action buttons have a
 * 44pt touch area and texts from `labels` (translatable).
 *
 * Keyboard: on focus it registers with the root UIProvider's host, which
 * lifts the app just enough for the whole field (label, field and error) to
 * sit above the keyboard — without depending on Screen or a ScrollView. What
 * you type is always visible.
 *
 * Validation: `required` and `rules` run when leaving the field (`validateOn`),
 * the error appears in writing, is announced to the screen reader and, once
 * visible, is revalidated on every change so it disappears as soon as it is
 * fixed. An `error` passed by hand overrides the internal validation.
 */
export const Input = memo(
  forwardRef<InputHandle, InputProps>(({
    label,
    required = false,
    error: errorProp,
    rules,
    validateOn = 'blur',
    onValidate,
    onChangeText,
    containerStyle,
    leftIconName,
    rightIconName,
    onRightIconPress,
    rightIconAccessibilityLabel,
    isPassword = false,
    isLoading = false,
    style,
    onFocus,
    onBlur,
    testID,
    ...props
  }, ref) => {
    const colors = useColors();
    const styles = useStyles();
    const allowFontScaling = useAllowFontScaling();
    const labels = useLabels();
    const theme = useTheme();
    const readOnly = props.editable === false;
    const [isFocused, setIsFocused] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const focusProgress = useRef(new Animated.Value(0)).current;
    const inputRef = useRef<TextInput>(null);
    const containerRef = useRef<View>(null);
    const [internalError, setInternalError] = useState<string | undefined>(undefined);
    // Last known value: the controlled one (`value`) or what was typed (uncontrolled).
    const valueRef = useRef(props.value ?? props.defaultValue ?? '');
    if (props.value !== undefined) valueRef.current = props.value;
    const error = errorProp ?? internalError;

    const runValidation = () => {
      const next = validateInputValue(valueRef.current, { required, rules }, labels);
      setInternalError(next);
      onValidate?.(next);
      return next;
    };

    useImperativeHandle(ref, () => Object.assign(inputRef.current as TextInput, { validate: runValidation }));

    // The new error is announced right away, not only as a hint when returning to the field.
    useEffect(() => {
      if (internalError && errorProp === undefined) AccessibilityInfo.announceForAccessibility(internalError);
    }, [internalError, errorProp]);

    const keyboard = useKeyboardField(containerRef);

    // If the error appears or changes while the field is focused, the block grows:
    // a readjustment is requested so the error line isn't covered either.
    useEffect(() => {
      if (isFocused) keyboard.focus();
    }, [error, isFocused, keyboard]);

    const handleFocus: TextInputProps['onFocus'] = (e) => {
      setIsFocused(true);
      keyboard.focus();
      Animated.timing(focusProgress, { toValue: 1, duration: theme.tokens.duration.base, useNativeDriver: false }).start();
      onFocus?.(e);
    };

    const handleBlur: TextInputProps['onBlur'] = (e) => {
      setIsFocused(false);
      keyboard.blur();
      if (validateOn === 'blur') runValidation();
      Animated.timing(focusProgress, { toValue: 0, duration: theme.tokens.duration.base, useNativeDriver: false }).start();
      onBlur?.(e);
    };

    const handleChangeText = (text: string) => {
      valueRef.current = text;
      onChangeText?.(text);
      if (validateOn === 'change' || internalError) runValidation();
    };

    const borderColor = error
      ? colors.error
      : focusProgress.interpolate({ outputRange: [colors.border, colors.primary], inputRange: [0, 1] });

    return (
      <View ref={containerRef} style={[styles.container, containerStyle]} testID={testID}>
        {!!label && (
          <Text allowFontScaling={allowFontScaling} style={styles.label}>
            {label}
            {required && <Text style={styles.required}> *</Text>}
          </Text>
        )}

        <Animated.View style={[styles.inputWrapper, readOnly && styles.readOnly, { borderColor }]}>
          {leftIconName && <Icon name={leftIconName} size={20} color={colors.textLight} style={styles.leftIcon} />}

          <TextInput
            ref={inputRef}
            style={[styles.input, style]}
            placeholderTextColor={colors.textLight}
            onFocus={handleFocus}
            onBlur={handleBlur}
            secureTextEntry={isPassword && !showPassword}
            allowFontScaling={allowFontScaling}
            textAlignVertical="center"
            accessibilityLabel={
              label || props.placeholder ? `${label ?? props.placeholder}${required ? `, ${labels.required}` : ''}` : undefined
            }
            accessibilityHint={error || undefined}
            accessibilityState={{ disabled: readOnly, busy: isLoading }}
            {...props}
            onChangeText={handleChangeText}
          />

          {isLoading ? (
            <View style={styles.rightIcon}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : isPassword ? (
            <TouchableOpacity
              onPress={() => setShowPassword((v) => !v)}
              style={styles.rightIcon}
              accessibilityRole="button"
              accessibilityLabel={showPassword ? labels.hidePassword : labels.showPassword}
            >
              <Icon name={showPassword ? 'eye-off' : 'eye'} size={20} color={colors.textLight} />
            </TouchableOpacity>
          ) : rightIconName ? (
            <TouchableOpacity
              onPress={onRightIconPress}
              style={styles.rightIcon}
              disabled={!onRightIconPress}
              accessibilityRole="button"
              accessibilityLabel={rightIconAccessibilityLabel ?? labels.clear}
            >
              <Icon name={rightIconName} size={20} color={colors.textLight} />
            </TouchableOpacity>
          ) : null}
        </Animated.View>

        {!!error && (
          <Text allowFontScaling={allowFontScaling} style={styles.errorText}>
            {error}
          </Text>
        )}
      </View>
    );
  })
);
Input.displayName = 'Input';
