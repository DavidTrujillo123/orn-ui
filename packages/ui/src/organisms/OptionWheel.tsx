import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  ScrollView,
  Text,
  View,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { createStyles } from '../theme/createStyles';
import { useAllowFontScaling, useTheme } from '../theme/UIProvider';
import { useReduceMotion } from '../atoms/Transition';

export interface OptionWheelOption<T> {
  label: string;
  value: T;
  /** The wheel refuses to settle here and slides to the nearest enabled row. */
  disabled?: boolean;
}

export interface OptionWheelProps<T> {
  options: OptionWheelOption<T>[];
  selectedValue: T | undefined;
  onSelect: (value: T) => void;
  /** Title above the wheel. */
  label?: string;
  /** Required when there's no `label`: the wheel as a whole needs a name. */
  accessibilityLabel?: string;
  /**
   * Rows on screen. Forced to the next odd number so one of them is the
   * centre. @default 5
   */
  visibleCount?: number;
  /** Height of each row. @default 44 */
  itemHeight?: number;
  /** Fixed text to the right of the centre row ('kg', 'min'). */
  unit?: string;
  /** Tilts the far rows to suggest a cylinder. @default true */
  perspective?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const DEFAULT_VISIBLE_COUNT = 5;
/** 44pt: el mínimo táctil de iOS, y alcanza para una línea `lg` con aire. */
const DEFAULT_ITEM_HEIGHT = 44;
/**
 * Filas hacia cada lado que la interpolación distingue; más lejos, todas
 * iguales (`extrapolate: 'clamp'`). Los tres rangos son simétricos respecto
 * del centro: la fila de arriba y la de abajo se ven igual, sólo que la de
 * arriba se inclina hacia atrás y la de abajo hacia adelante.
 */
const FALLOFF = 2;
const OPACITY_RANGE = [0.22, 0.55, 1, 0.55, 0.22];
const SCALE_RANGE = [0.8, 0.9, 1, 0.9, 0.8];
const ROTATION_RANGE = ['60deg', '32deg', '0deg', '-32deg', '-60deg'];

const useStyles = createStyles((theme) => ({
  root: { gap: theme.tokens.spacing.sm },
  label: {
    fontWeight: theme.tokens.fontWeight.bold,
    fontSize: theme.tokens.fontSize.md,
    color: theme.colors.text,
  },
  viewport: { overflow: 'hidden' },
  disabled: { opacity: 0.5 },
  // La ventana central: figura contra el fondo de opciones que pasan.
  window: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.primarySoft,
  },
  row: { justifyContent: 'center', alignItems: 'center' },
  rowContent: { flexDirection: 'row', alignItems: 'center', gap: theme.tokens.spacing.xs },
  text: { fontSize: theme.tokens.fontSize.lg, color: theme.colors.text },
  textDisabled: { color: theme.colors.textLight },
  unit: { fontSize: theme.tokens.fontSize.sm, color: theme.colors.textLight },
}));

/** El índice habilitado más cercano a `index`, o -1 si no hay ninguno. */
function nearestEnabled<T>(options: OptionWheelOption<T>[], index: number): number {
  if (options.length === 0) return -1;
  for (let step = 0; step < options.length; step += 1) {
    const before = index - step;
    const after = index + step;
    if (after < options.length && !options[after]?.disabled) return after;
    if (before >= 0 && !options[before]?.disabled) return before;
  }
  return -1;
}

/**
 * OptionWheel
 * Selector de rueda: las opciones pasan por una ventana fija y la que queda en
 * el centro es la elegida. El scroll hace snap a la altura de fila, así que
 * soltar el dedo en cualquier lado siempre deja una opción centrada y no media.
 *
 * Gestalt, figura y fondo: lo que marca la selección no es un estilo sobre la
 * fila —que viajaría con ella— sino una ventana quieta encima de la lista. La
 * figura se queda, el fondo se mueve, y por eso la rueda se lee sin leer: el
 * lugar señala, no el color. Y destino común: todas las filas se achican y se
 * inclinan con la misma ley respecto del centro, de modo que se perciben como
 * una superficie rígida que gira y no como N filas animándose por su cuenta.
 *
 * La escala, la opacidad y la inclinación salen de interpolar el
 * `contentOffset` del scroll, no del estado de React: se calculan en el hilo
 * nativo (`useNativeDriver`) y el hilo de JS sólo participa cuando la rueda ya
 * frenó, para avisar qué quedó elegido. Con "reducir movimiento" activo se
 * apaga la inclinación y queda el tamaño, que es información, no decoración.
 *
 * `disabled` en una opción no puede impedir que el snap la centre, así que la
 * rueda la centra y se corre sola a la habilitada más cercana.
 */
export function OptionWheel<T extends string | number>({
  options,
  selectedValue,
  onSelect,
  label,
  accessibilityLabel,
  visibleCount = DEFAULT_VISIBLE_COUNT,
  itemHeight = DEFAULT_ITEM_HEIGHT,
  unit,
  perspective = true,
  disabled = false,
  style,
  testID,
}: OptionWheelProps<T>) {
  const theme = useTheme();
  const styles = useStyles();
  const allowFontScaling = useAllowFontScaling();
  const reduceMotion = useReduceMotion();

  const scrollRef = useRef<ScrollView>(null);
  const scrollY = useRef(new Animated.Value(0)).current;
  // El primer posicionamiento no se anima: la rueda tiene que aparecer ya
  // puesta en su valor, no viajando hasta él.
  const settled = useRef(false);

  // Impar siempre: con un número par no hay fila central que alinear con la
  // ventana, y el snap dejaría la selección entre dos filas.
  const rows = visibleCount % 2 === 0 ? visibleCount + 1 : visibleCount;
  const padding = ((rows - 1) / 2) * itemHeight;
  const height = rows * itemHeight;

  const selectedIndex = useMemo(
    () => options.findIndex((option) => option.value === selectedValue),
    [options, selectedValue]
  );

  const scrollToIndex = useCallback(
    (index: number, animated: boolean) => {
      scrollRef.current?.scrollTo({ y: index * itemHeight, animated });
    },
    [itemHeight]
  );

  useEffect(() => {
    if (selectedIndex < 0) return;
    scrollToIndex(selectedIndex, settled.current && !reduceMotion);
    settled.current = true;
  }, [selectedIndex, scrollToIndex, reduceMotion]);

  /**
   * Corre tanto al final del arrastre como al final de la inercia: en Android
   * un arrastre corto sin impulso no dispara `onMomentumScrollEnd`, y la rueda
   * se quedaría con la selección vieja. Reentrar con el mismo índice es inocuo
   * porque sólo avisa cuando cambia.
   */
  const commit = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const raw = Math.round(event.nativeEvent.contentOffset.y / itemHeight);
      const clamped = Math.min(Math.max(raw, 0), options.length - 1);
      const landed = options[clamped];
      if (!landed) return;
      const target = landed.disabled ? nearestEnabled(options, clamped) : clamped;
      const option = options[target];
      // Sin opciones habilitadas no hay dónde parar: la rueda se queda donde
      // la dejaron y no avisa nada.
      if (!option) return;
      if (target !== clamped) scrollToIndex(target, true);
      if (option.value !== selectedValue) onSelect(option.value);
    },
    [options, itemHeight, selectedValue, onSelect, scrollToIndex]
  );

  /** VoiceOver/TalkBack recorren la rueda con increment/decrement, no con el dedo. */
  const step = useCallback(
    (delta: number) => {
      if (disabled || selectedIndex < 0) return;
      const next = nearestEnabled(options, selectedIndex + delta);
      const option = options[next];
      // En el borde, `nearestEnabled` devuelve la fila donde ya estamos.
      if (!option || next === selectedIndex) return;
      onSelect(option.value);
    },
    [disabled, options, selectedIndex, onSelect]
  );

  const onLayout = useCallback(
    (_: LayoutChangeEvent) => {
      if (selectedIndex >= 0) scrollToIndex(selectedIndex, false);
    },
    [selectedIndex, scrollToIndex]
  );

  const selected = selectedIndex >= 0 ? options[selectedIndex] : undefined;

  return (
    <View style={[styles.root, disabled && styles.disabled, style]} testID={testID}>
      {!!label && (
        <Text allowFontScaling={allowFontScaling} style={styles.label}>
          {label}
        </Text>
      )}

      <View
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={label ?? accessibilityLabel}
        accessibilityValue={{ text: selected?.label }}
        accessibilityState={{ disabled }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={(event) => step(event.nativeEvent.actionName === 'increment' ? 1 : -1)}
        style={[styles.viewport, { height }]}
        testID={testID && `${testID}-viewport`}
      >
        <View
          pointerEvents="none"
          style={[styles.window, { top: padding, height: itemHeight, borderRadius: theme.tokens.radius.sm }]}
        />

        <Animated.ScrollView
          ref={scrollRef as never}
          onLayout={onLayout}
          scrollEnabled={!disabled}
          showsVerticalScrollIndicator={false}
          snapToInterval={itemHeight}
          decelerationRate="fast"
          scrollEventThrottle={16}
          contentContainerStyle={{ paddingVertical: padding }}
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
            useNativeDriver: true,
          })}
          onScrollEndDrag={commit}
          onMomentumScrollEnd={commit}
          testID={testID && `${testID}-scroll`}
        >
          {options.map((option, index) => {
            const centre = index * itemHeight;
            const inputRange = [
              centre - FALLOFF * itemHeight,
              centre - itemHeight,
              centre,
              centre + itemHeight,
              centre + FALLOFF * itemHeight,
            ];
            type Interpolated = Animated.AnimatedInterpolation<string | number>;
            const transform: Array<{ perspective: number } | { scale: Interpolated } | { rotateX: Interpolated }> = [
              { scale: scrollY.interpolate({ inputRange, outputRange: SCALE_RANGE, extrapolate: 'clamp' }) },
            ];
            if (perspective && !reduceMotion) {
              // El perspective va primero: aplicado después de la rotación no
              // deforma nada y la fila se ve plana aunque esté rotada.
              transform.unshift({ perspective: height * 2 });
              transform.push({
                rotateX: scrollY.interpolate({ inputRange, outputRange: ROTATION_RANGE, extrapolate: 'clamp' }),
              });
            }

            return (
              <Animated.View
                key={String(option.value)}
                testID={testID && `${testID}-item-${index}`}
                style={[
                  styles.row,
                  {
                    height: itemHeight,
                    opacity: scrollY.interpolate({
                      inputRange,
                      outputRange: OPACITY_RANGE,
                      extrapolate: 'clamp',
                    }),
                    transform,
                  },
                ]}
              >
                <View style={styles.rowContent}>
                  <Text
                    allowFontScaling={allowFontScaling}
                    style={[styles.text, option.disabled && styles.textDisabled]}
                  >
                    {option.label}
                  </Text>
                  {!!unit && index === selectedIndex && (
                    <Text allowFontScaling={allowFontScaling} style={styles.unit}>
                      {unit}
                    </Text>
                  )}
                </View>
              </Animated.View>
            );
          })}
        </Animated.ScrollView>
      </View>
    </View>
  );
}
