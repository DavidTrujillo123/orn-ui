import React, { memo, useState } from 'react';
import { TextInput, TouchableOpacity, View, type StyleProp, type ViewStyle } from 'react-native';
import { createStyles } from '../theme/createStyles';
import { useAllowFontScaling, useColors, useTheme } from '../theme/UIProvider';
import { Icon } from '../icons/Icon';

export type StepperSize = 'sm' | 'md' | 'lg';

export interface StepperProps {
  value: string;
  onChangeText: (text: string) => void;
  onIncrement: () => void;
  onDecrement: () => void;
  /** Escala del control: alto, botones, ícono y tipografía. @default 'md' */
  size?: StepperSize;
  /** Ocupa todo el ancho disponible y el input se lleva el sobrante. @default false */
  block?: boolean;
  /**
   * En false el valor sólo se cambia con los botones: el teclado no se abre y
   * el campo pierde el fondo que lo anuncia como editable. @default true
   */
  editable?: boolean;
  /**
   * Mínimo permitido. Deshabilita "-" al alcanzarlo y acota lo tipeado al
   * salir del campo. Los negativos se aceptan sólo si `min` es negativo.
   */
  min?: number;
  /** Máximo permitido. Deshabilita "+" al alcanzarlo y acota lo tipeado. */
  max?: number;
  /** Acepta un separador decimal, normalizando la coma a punto. @default false */
  allowDecimals?: boolean;
  style?: StyleProp<ViewStyle>;
  incrementAccessibilityLabel?: string;
  decrementAccessibilityLabel?: string;
  testID?: string;
}

const SIZES: Record<StepperSize, { height: number; icon: number; inputWidth: number }> = {
  sm: { height: 36, icon: 18, inputWidth: 48 },
  md: { height: 44, icon: 20, inputWidth: 56 },
  lg: { height: 52, icon: 22, inputWidth: 64 },
};

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
  // El fondo distingue el campo de un valor de sólo lectura: es la única
  // señal de que ahí se puede tipear antes de tocarlo.
  editable: { backgroundColor: theme.colors.inputBackground },
}));

/** Deja sólo lo que puede formar parte del número permitido por el rango. */
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
 * Botón "-" + input numérico editable + botón "+". `size` controla sólo la
 * escala y `block` sólo el ancho, así que los dos ejes se combinan libremente.
 *
 * El componente no hace la aritmética de los botones —eso vive en
 * `onIncrement`/`onDecrement`—, pero sí limpia lo que se tipea y avisa cuándo
 * el valor llegó a un extremo del rango deshabilitando el botón que lo pasaría.
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
    incrementAccessibilityLabel = 'Increment',
    decrementAccessibilityLabel = 'Decrement',
    testID,
  }: StepperProps) => {
    const theme = useTheme();
    const colors = useColors();
    const styles = useStyles();
    const allowFontScaling = useAllowFontScaling();
    const [focused, setFocused] = useState(false);

    const { height, icon, inputWidth } = SIZES[size];
    const fontSize =
      size === 'sm' ? theme.tokens.fontSize.md : size === 'md' ? theme.tokens.fontSize.lg : theme.tokens.fontSize.xl;

    const allowNegative = min !== undefined && min < 0;
    const numeric = Number(value);
    const isNumber = value.trim() !== '' && Number.isFinite(numeric);
    const atMin = isNumber && min !== undefined && numeric <= min;
    const atMax = isNumber && max !== undefined && numeric >= max;

    const handleChangeText = (text: string) => {
      onChangeText(sanitizeNumeric(text, { allowDecimals, allowNegative }));
    };

    // El recorte al rango espera al blur: hacerlo mientras se tipea impide
    // llegar a "12" cuando el mínimo es 5, porque el "1" ya se corregiría.
    const handleBlur = () => {
      setFocused(false);
      if (!isNumber) return;
      const clamped = Math.min(max ?? numeric, Math.max(min ?? numeric, numeric));
      if (clamped !== numeric) onChangeText(String(clamped));
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
        testID={testID}
        style={[
          styles.control,
          { height },
          block && styles.controlBlock,
          focused && { borderColor: colors.primary },
          style,
        ]}
      >
        {stepButton('decrement', onDecrement, atMin, decrementAccessibilityLabel)}
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
          onFocus={() => setFocused(true)}
          onBlur={handleBlur}
          editable={editable}
          keyboardType={allowDecimals ? 'decimal-pad' : 'number-pad'}
          selectTextOnFocus
          accessibilityLabel="Quantity"
        />
        {stepButton('increment', onIncrement, atMax, incrementAccessibilityLabel)}
      </View>
    );
  }
);
Stepper.displayName = 'Stepper';
