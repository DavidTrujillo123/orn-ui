import React, { memo, useRef, useState } from 'react';
import {
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
import { useAllowFontScaling, useColors } from '../theme/UIProvider';
import { Icon } from '../icons/Icon';
import type { IconName } from '../icons/types';

export interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  /** Shows an asterisk next to the label. Purely visual, doesn't validate anything. */
  required?: boolean;
  error?: string;
  containerStyle?: StyleProp<ViewStyle>;
  style?: TextInputProps['style'];
  leftIconName?: IconName;
  rightIconName?: IconName;
  onRightIconPress?: () => void;
  isPassword?: boolean;
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
  rightIcon: { padding: theme.tokens.spacing.sm + 2, marginRight: theme.tokens.spacing.xs },
  errorText: { marginTop: theme.tokens.spacing.xs, fontSize: theme.tokens.fontSize.sm, color: theme.colors.errorText },
}));

/**
 * Input
 * El borde anima color entre border/primary/error con Animated (no
 * useNativeDriver: los navegadores de color en RN sin Fabric solo son
 * confiables en el hilo de JS; el costo es despreciable, se anima un borde).
 */
export const Input = memo(
  ({
    label,
    required = false,
    error,
    containerStyle,
    leftIconName,
    rightIconName,
    onRightIconPress,
    isPassword = false,
    isLoading = false,
    style,
    onFocus,
    onBlur,
    testID,
    ...props
  }: InputProps) => {
    const colors = useColors();
    const styles = useStyles();
    const allowFontScaling = useAllowFontScaling();
    const [isFocused, setIsFocused] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const focusProgress = useRef(new Animated.Value(0)).current;

    const handleFocus: TextInputProps['onFocus'] = (e) => {
      setIsFocused(true);
      Animated.timing(focusProgress, { toValue: 1, duration: 200, useNativeDriver: false }).start();
      onFocus?.(e);
    };

    const handleBlur: TextInputProps['onBlur'] = (e) => {
      setIsFocused(false);
      Animated.timing(focusProgress, { toValue: 0, duration: 200, useNativeDriver: false }).start();
      onBlur?.(e);
    };

    const borderColor = error
      ? colors.error
      : focusProgress.interpolate({ outputRange: [colors.border, colors.primary], inputRange: [0, 1] });

    return (
      <View style={[styles.container, containerStyle]} testID={testID}>
        {label && (
          <Text allowFontScaling={allowFontScaling} style={styles.label}>
            {label}
            {required && <Text style={styles.required}> *</Text>}
          </Text>
        )}

        <Animated.View style={[styles.inputWrapper, { borderColor }]}>
          {leftIconName && <Icon name={leftIconName} size={20} color={colors.textLight} style={styles.leftIcon} />}

          <TextInput
            style={[styles.input, style]}
            placeholderTextColor={colors.textLight}
            onFocus={handleFocus}
            onBlur={handleBlur}
            secureTextEntry={isPassword && !showPassword}
            allowFontScaling={allowFontScaling}
            textAlignVertical="center"
            accessibilityLabel={label ?? props.placeholder}
            {...props}
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
              accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
            >
              <Icon name={showPassword ? 'eye-off' : 'eye'} size={20} color={colors.textLight} />
            </TouchableOpacity>
          ) : rightIconName ? (
            <TouchableOpacity
              onPress={onRightIconPress}
              style={styles.rightIcon}
              disabled={!onRightIconPress}
              accessibilityRole="button"
              accessibilityLabel="Clear"
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
  }
);
Input.displayName = 'Input';
