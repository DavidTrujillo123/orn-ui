import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { LayoutChangeEvent, NativeScrollEvent, NativeSyntheticEvent, ScrollView } from 'react-native';
import { useReduceMotion } from '../atoms/Transition';

export type SlidesOrientation = 'horizontal' | 'vertical';

export interface UseSlidesOptions {
  total: number;
  orientation: SlidesOrientation;
  loop: boolean;
  autoPlay: boolean;
  interval: number;
  /** Controlled index; without it the internal state rules. */
  index?: number;
  defaultIndex: number;
  onIndexChange?: (index: number) => void;
}

/** A page of the scroll. The infinite mode's clones repeat a neighbor's `real`. */
export interface SlidesPage {
  real: number;
  clone: 'head' | 'tail' | null;
}

export interface UseSlidesResult {
  active: number;
  pages: SlidesPage[];
  isHorizontal: boolean;
  isLoop: boolean;
  size: { width: number; height: number };
  /** Length of a page along the scroll axis. At 0 it hasn't been measured yet. */
  pageSize: number;
  scrollRef: React.RefObject<ScrollView | null>;
  autoPlayPaused: boolean;
  /** The system asked to reduce motion: no autoPlay or transitions. */
  motionReduced: boolean;
  goTo: (index: number) => void;
  toggleAutoPlay: () => void;
  onLayout: (event: LayoutChangeEvent) => void;
  onMomentumScrollEnd: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  onScrollBeginDrag: () => void;
  onScrollEndDrag: () => void;
}

export function clampIndex(value: number, total: number): number {
  if (total === 0) return 0;
  if (value < 0) return 0;
  if (value > total - 1) return total - 1;
  return value;
}

/**
 * useSlides
 * Everything in `Slides` that isn't visible: which page is framed, when to
 * move the scroll, how the infinite mode's clones map to real indexes, and the
 * autoplay clock.
 *
 * It works only with indexes, never with the items: that way it doesn't need
 * the component's generic `T`, and the UI resolves `pages[i].real` against its own `data`.
 */
export function useSlides({
  total,
  orientation,
  loop,
  autoPlay,
  interval,
  index,
  defaultIndex,
  onIndexChange,
}: UseSlidesOptions): UseSlidesResult {
  const motionReduced = useReduceMotion();
  const isHorizontal = orientation === 'horizontal';
  // A single element has nowhere to cycle to: it would be swipeable between
  // three copies of the same thing.
  const isLoop = loop && total > 1;

  const [uncontrolled, setUncontrolled] = useState(() => clampIndex(defaultIndex, total));
  const active = clampIndex(index ?? uncontrolled, total);
  const activeRef = useRef(active);
  activeRef.current = active;

  const [autoPlayPaused, setAutoPlayPaused] = useState(false);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const pageSize = isHorizontal ? size.width : size.height;

  const scrollRef = useRef<ScrollView>(null);
  /** The page actually visible (index within `pages`, clones included). */
  const offsetPageRef = useRef(isLoop ? 1 : 0);
  const didInitRef = useRef(false);
  const lastPageSizeRef = useRef(0);
  const draggingRef = useRef(false);

  const pages = useMemo<SlidesPage[]>(() => {
    const real = Array.from({ length: total }, (_, i) => ({ real: i, clone: null }));
    if (!isLoop) return real;
    return [{ real: total - 1, clone: 'head' }, ...real, { real: 0, clone: 'tail' }];
  }, [isLoop, total]);

  const scrollToPage = useCallback(
    (page: number, animated: boolean) => {
      const offset = page * pageSize;
      scrollRef.current?.scrollTo({
        x: isHorizontal ? offset : 0,
        y: isHorizontal ? 0 : offset,
        animated,
      });
    },
    [isHorizontal, pageSize]
  );

  const goTo = useCallback(
    (next: number) => {
      if (next === activeRef.current) return;
      activeRef.current = next;
      if (index == null) setUncontrolled(next);
      onIndexChange?.(next);
    },
    [index, onIndexChange]
  );

  // Only acts when the index and the visible page disagree: a change that
  // came from the gesture itself doesn't fire a second scroll on top of the one that stopped.
  useEffect(() => {
    if (pageSize === 0 || total === 0) return;
    const target = isLoop ? active + 1 : active;
    const resized = lastPageSizeRef.current !== pageSize;
    if (offsetPageRef.current === target && didInitRef.current && !resized) return;
    // Neither the first positioning nor the rearrangement on rotation is a
    // slide change: animating them would be a slide nobody asked for.
    const animated = didInitRef.current && !resized;
    didInitRef.current = true;
    lastPageSizeRef.current = pageSize;
    offsetPageRef.current = target;
    scrollToPage(target, animated);
  }, [active, isLoop, pageSize, scrollToPage, total]);

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setSize((prev) => (prev.width === width && prev.height === height ? prev : { width, height }));
  }, []);

  const onMomentumScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      draggingRef.current = false;
      if (pageSize === 0) return;
      const { contentOffset } = event.nativeEvent;
      const page = Math.round((isHorizontal ? contentOffset.x : contentOffset.y) / pageSize);

      if (isLoop) {
        if (page === 0) {
          offsetPageRef.current = total;
          scrollToPage(total, false);
          goTo(total - 1);
          return;
        }
        if (page === total + 1) {
          offsetPageRef.current = 1;
          scrollToPage(1, false);
          goTo(0);
          return;
        }
        offsetPageRef.current = page;
        goTo(page - 1);
        return;
      }

      offsetPageRef.current = page;
      goTo(clampIndex(page, total));
    },
    [goTo, isHorizontal, isLoop, pageSize, scrollToPage, total]
  );

  const onScrollBeginDrag = useCallback(() => {
    draggingRef.current = true;
  }, []);

  const onScrollEndDrag = useCallback(() => {
    // A short drag can be released without momentum and not emit
    // momentumScrollEnd: without this autoPlay would stay paused forever.
    draggingRef.current = false;
  }, []);

  const toggleAutoPlay = useCallback(() => setAutoPlayPaused((paused) => !paused), []);

  useEffect(() => {
    if (!autoPlay || autoPlayPaused || motionReduced || total < 2 || pageSize === 0) return;
    const timer = setInterval(() => {
      if (draggingRef.current) return;
      const from = activeRef.current;
      if (from < total - 1) {
        goTo(from + 1);
        return;
      }
      if (!isLoop) return;
      // Last one in infinite mode: advances to the clone of the first instead
      // of rewinding; momentumScrollEnd completes the jump to the original.
      offsetPageRef.current = total + 1;
      scrollToPage(total + 1, true);
    }, interval);
    return () => clearInterval(timer);
  }, [autoPlay, autoPlayPaused, goTo, interval, isLoop, motionReduced, pageSize, scrollToPage, total]);

  return {
    active,
    pages,
    isHorizontal,
    isLoop,
    size,
    pageSize,
    scrollRef,
    autoPlayPaused,
    motionReduced,
    goTo,
    toggleAutoPlay,
    onLayout,
    onMomentumScrollEnd,
    onScrollBeginDrag,
    onScrollEndDrag,
  };
}
