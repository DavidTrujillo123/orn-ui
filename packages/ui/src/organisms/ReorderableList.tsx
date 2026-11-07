import React, { useRef, useState } from 'react';
import { Animated, PanResponder, View, type StyleProp, type ViewStyle } from 'react-native';
import { createStyles } from '../theme/createStyles';

export interface ReorderableListProps<T> {
  /** Items, in their current order. */
  data: T[];
  /** Stable key per item. */
  keyExtractor: (item: T, index: number) => string;
  /** Fixed height of each row: needed to calculate the target index without measuring layout async. */
  itemHeight: number;
  /** Renders each row; the third argument is true while that row is being dragged. */
  renderItem: (item: T, index: number, dragging: boolean) => React.ReactElement;
  /** Called on release, with the array already reordered. Does not mutate `data`. */
  onReorder: (data: T[]) => void;
  /**
   * Starts dragging row `index`. Use it to turn off the container's scroll
   * (`scrollEnabled={false}`) while it lasts: on iOS the parent
   * `UIScrollView` cancels touches on the content as soon as its
   * vertical gesture starts, and without this the drag dies within a few pixels.
   */
  onDragStart?: (index: number) => void;
  /** Ends the drag — on release or cancellation. Always runs if `onDragStart` ran. */
  onDragEnd?: () => void;
  /** Turns off dragging. @default false */
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

/** Reorders by moving the item from `from` to `to`, without mutating `data`. Exported separately so it can be tested without simulating gestures. */
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
 * Law of common fate: when dragging a row, the rows it has to cross shift
 * together in the same direction — that is what communicates "they are
 * going to swap places" before the finger lifts, not a simple highlight of
 * the active item.
 *
 * No external gesture/animation dependencies (reanimated, gesture-handler):
 * PanResponder + Animated are enough because computing the target index
 * needs the drag value in JS on every move (not something useNativeDriver
 * can resolve on its own).
 *
 * Inside a vertical scroll you have to wire `onDragStart`/`onDragEnd` to
 * `scrollEnabled`, or on iOS the drag never gets to start:
 *
 * ```tsx
 * const [dragging, setDragging] = useState(false);
 * <ScrollView scrollEnabled={!dragging}>
 *   <ReorderableList onDragStart={() => setDragging(true)} onDragEnd={() => setDragging(false)} … />
 * </ScrollView>
 * ```
 */
export function ReorderableList<T>({
  data,
  keyExtractor,
  itemHeight,
  renderItem,
  onReorder,
  onDragStart,
  onDragEnd,
  disabled = false,
  style,
}: ReorderableListProps<T>) {
  const styles = useStyles();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [targetIndex, setTargetIndex] = useState<number | null>(null);
  const dy = useRef(new Animated.Value(0)).current;
  const activeIndexRef = useRef<number | null>(null);
  // Each row's PanResponder is created only once (cached in the Map below)
  // and its closure stays fixed to that first render: reading `targetIndex`
  // (state) directly there would always give the value from mount. A ref
  // does reflect the latest write no matter when the closure reading it was
  // created.
  const targetIndexRef = useRef<number | null>(null);
  const dataRef = useRef(data);
  dataRef.current = data;
  // Same reason as targetIndexRef: each row's responder is created only
  // once, so reading `disabled` straight from the closure would freeze the
  // value from when that row was created.
  const disabledRef = useRef(disabled);
  disabledRef.current = disabled;
  // Same reason: the callbacks are read from closures created only once.
  const onReorderRef = useRef(onReorder);
  onReorderRef.current = onReorder;
  const onDragStartRef = useRef(onDragStart);
  onDragStartRef.current = onDragStart;
  const onDragEndRef = useRef(onDragEnd);
  onDragEndRef.current = onDragEnd;

  const panResponders = useRef(new Map<number, ReturnType<typeof PanResponder.create>>()).current;
  // If `data` shrinks, the responders for indexes that no longer exist stay
  // stuck in the Map forever: they are pruned on every render.
  for (const index of panResponders.keys()) {
    if (index >= data.length) panResponders.delete(index);
  }

  function panResponderFor(index: number) {
    let responder = panResponders.get(index);
    if (responder) return responder;

    const endDrag = () => {
      dy.setValue(0);
      activeIndexRef.current = null;
      targetIndexRef.current = null;
      setActiveIndex(null);
      setTargetIndex(null);
      onDragEndRef.current?.();
    };

    responder = PanResponder.create({
      onStartShouldSetPanResponder: () => !disabledRef.current,
      onMoveShouldSetPanResponder: (_, gesture) => !disabledRef.current && Math.abs(gesture.dy) > 2,
      // A parent scroll requests the responder as soon as its vertical gesture
      // starts — the same axis as the drag. Yielding it would cancel the drag
      // midway, so the row keeps it until release.
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => {
        activeIndexRef.current = index;
        targetIndexRef.current = index;
        setActiveIndex(index);
        setTargetIndex(index);
        dy.setValue(0);
        onDragStartRef.current?.(index);
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
        endDrag();
        if (from === null || to === null || from === to) return;
        onReorderRef.current(move(dataRef.current, from, to));
      },
      onPanResponderTerminate: endDrag,
    });
    panResponders.set(index, responder);
    return responder;
  }

  return (
    <View style={style}>
      {data.map((item, index) => {
        const isActive = activeIndex === index;
        // Rows between the origin and the target shift one full place in the
        // drag direction: it is the "group moving together" effect.
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
