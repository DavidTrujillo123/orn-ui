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
import { useAllowFontScaling, useColors, useLabels, useTheme } from '../theme/UIProvider';
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
  /** Nombre accesible del botón de `rightIconName`. @default labels.clear */
  rightIconAccessibilityLabel?: string;
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
  // Ícono 20 + padding md (12) por lado = 44pt de área táctil (Fitts).
  rightIcon: { padding: theme.tokens.spacing.md, marginRight: theme.tokens.spacing.xxs },
  // Solo lectura: sin relleno, así no parece un campo que se puede tocar
  // (affordance), pero el texto conserva su contraste para leerse.
  readOnly: { backgroundColor: 'transparent' },
  errorText: { marginTop: theme.tokens.spacing.xs, fontSize: theme.tokens.fontSize.sm, color: theme.colors.errorText },
}));

/**
 * Input
 * El borde anima color entre border/primary/error con Animated (no
 * useNativeDriver: los navegadores de color en RN sin Fabric solo son
 * confiables en el hilo de JS; el costo es despreciable, se anima un borde).
 *
 * Gestalt:
 * - Proximidad: label (`spacing.sm` arriba) y error (`spacing.xs` abajo) van
 *   pegados al campo y el siguiente campo queda a `spacing.lg`: cada label y
 *   su error se leen con su campo, no con el vecino.
 * - Región común: ícono izquierdo, texto y acción derecha comparten el mismo
 *   borde y fondo, así se leen como un solo control.
 * - Punto focal: el borde pasa a `primary` al enfocar y a `error` con error;
 *   el error además va escrito (no solo color).
 *
 * Accesibilidad: el nombre accesible incluye "required" si corresponde, el
 * error se anuncia como hint y los botones del ojo y de la acción derecha
 * tienen 44pt de área táctil y textos de `labels` (traducibles).
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
    rightIconAccessibilityLabel,
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
    const labels = useLabels();
    const theme = useTheme();
    const readOnly = props.editable === false;
    const [isFocused, setIsFocused] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const focusProgress = useRef(new Animated.Value(0)).current;

    const handleFocus: TextInputProps['onFocus'] = (e) => {
      setIsFocused(true);
      Animated.timing(focusProgress, { toValue: 1, duration: theme.tokens.duration.base, useNativeDriver: false }).start();
      onFocus?.(e);
    };

    const handleBlur: TextInputProps['onBlur'] = (e) => {
      setIsFocused(false);
      Animated.timing(focusProgress, { toValue: 0, duration: theme.tokens.duration.base, useNativeDriver: false }).start();
      onBlur?.(e);
    };

    const borderColor = error
      ? colors.error
      : focusProgress.interpolate({ outputRange: [colors.border, colors.primary], inputRange: [0, 1] });

    return (
      <View style={[styles.container, containerStyle]} testID={testID}>
        {!!label && (
          <Text allowFontScaling={allowFontScaling} style={styles.label}>
            {label}
            {required && <Text style={styles.required}> *</Text>}
          </Text>
        )}

        <Animated.View style={[styles.inputWrapper, readOnly && styles.readOnly, { borderColor }]}>
          {leftIconName && <Icon name={leftIconName} size={20} color={colors.textLight} style={styles.leftIcon} />}

          <TextInput
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
  }
);
Input.displayName = 'Input';
