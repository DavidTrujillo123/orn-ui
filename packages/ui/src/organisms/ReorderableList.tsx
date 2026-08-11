import React, { useRef, useState } from 'react';
import { Animated, PanResponder, View, type StyleProp, type ViewStyle } from 'react-native';
import { createStyles } from '../theme/createStyles';

export interface ReorderableListProps<T> {
  data: T[];
  keyExtractor: (item: T, index: number) => string;
  /** Alto fijo de cada fila: necesario para calcular el índice destino sin medir layout async. */
  itemHeight: number;
  renderItem: (item: T, index: number, dragging: boolean) => React.ReactElement;
  /** Se llama al soltar, con el arreglo ya reordenado. No muta `data`. */
  onReorder: (data: T[]) => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

/** Reordena moviendo el ítem de `from` a `to`, sin mutar `data`. Exportada aparte por ser testeable sin simular gestos. */
export function move<T>(data: T[], from: number, to: number): T[] {
  const next = data.slice();
  const [item] = next.splice(from, 1) as [T];
  next.splice(to, 0, item);
  return next;
}

const useStyles = createStyles(() => ({
  row: { width: '100%' },
}));

/**
 * ReorderableList
 * Ley de destino común (common fate): al arrastrar una fila, las filas que
 * tiene que atravesar se desplazan juntas en el mismo sentido — eso es lo
 * que comunica "van a intercambiar lugar" antes de soltar el dedo, no un
 * simple resaltado del ítem activo.
 *
 * Sin dependencias de gestos/animación externas (reanimated, gesture-handler):
 * PanResponder + Animated alcanzan porque el cálculo de índice destino
 * necesita el valor de arrastre en JS en cada movimiento (no algo que
 * useNativeDriver pueda resolver solo).
 */
export function ReorderableList<T>({
  data,
  keyExtractor,
  itemHeight,
  renderItem,
  onReorder,
  disabled = false,
  style,
}: ReorderableListProps<T>) {
  const styles = useStyles();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [targetIndex, setTargetIndex] = useState<number | null>(null);
  const dy = useRef(new Animated.Value(0)).current;
  const activeIndexRef = useRef<number | null>(null);
  // El PanResponder de cada fila se crea una sola vez (se cachea en el Map de
  // abajo) y su closure queda fijo al render de esa primera vez: leer
  // `targetIndex` (state) directamente ahí siempre daría el valor del
  // montaje. Un ref sí refleja la última escritura sin importar cuándo se
  // creó la closure que lo lee.
  const targetIndexRef = useRef<number | null>(null);
  const dataRef = useRef(data);
  dataRef.current = data;

  const panResponders = useRef(new Map<number, ReturnType<typeof PanResponder.create>>()).current;

  function panResponderFor(index: number) {
    let responder = panResponders.get(index);
    if (responder) return responder;

    responder = PanResponder.create({
      onStartShouldSetPanResponder: () => !disabled,
      onMoveShouldSetPanResponder: (_, gesture) => !disabled && Math.abs(gesture.dy) > 2,
      onPanResponderGrant: () => {
        activeIndexRef.current = index;
        targetIndexRef.current = index;
        setActiveIndex(index);
        setTargetIndex(index);
        dy.setValue(0);
      },
      onPanResponderMove: (_, gesture) => {
        dy.setValue(gesture.dy);
        const from = activeIndexRef.current;
        if (from === null) return;
        const rawTarget = from + Math.round(gesture.dy / itemHeight);
        const clamped = Math.max(0, Math.min(dataRef.current.length - 1, rawTarget));
        targetIndexRef.current = clamped;
        setTargetIndex((prev) => (prev === clamped ? prev : clamped));
      },
      onPanResponderRelease: () => {
        const from = activeIndexRef.current;
        const to = targetIndexRef.current;
        dy.setValue(0);
        activeIndexRef.current = null;
        targetIndexRef.current = null;
        setActiveIndex(null);
        setTargetIndex(null);
        if (from === null || to === null || from === to) return;
        onReorder(move(dataRef.current, from, to));
      },
      onPanResponderTerminate: () => {
        dy.setValue(0);
        activeIndexRef.current = null;
        targetIndexRef.current = null;
        setActiveIndex(null);
        setTargetIndex(null);
      },
    });
    panResponders.set(index, responder);
    return responder;
  }

  return (
    <View style={style}>
      {data.map((item, index) => {
        const isActive = activeIndex === index;
        // Filas entre el origen y el destino se corren un lugar entero en el
        // sentido del arrastre: es el efecto de "grupo que se mueve junto".
        let shift = 0;
        if (activeIndex !== null && targetIndex !== null && !isActive) {
          if (activeIndex < targetIndex && index > activeIndex && index <= targetIndex) shift = -itemHeight;
          else if (activeIndex > targetIndex && index < activeIndex && index >= targetIndex) shift = itemHeight;
        }

        return (
          <Animated.View
            key={keyExtractor(item, index)}
            style={[
              styles.row,
              isActive
                ? { transform: [{ translateY: dy }], zIndex: 1, elevation: 4 }
                : { transform: [{ translateY: shift }] },
            ]}
            {...panResponderFor(index).panHandlers}
          >
            {renderItem(item, index, isActive)}
          </Animated.View>
        );
      })}
    </View>
  );
}
