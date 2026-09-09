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
  /** Índice controlado; sin él manda el estado interno. */
  index?: number;
  defaultIndex: number;
  onIndexChange?: (index: number) => void;
}

/** Una página del scroll. Los clones del modo infinito repiten el `real` de un vecino. */
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
  /** Largo de una página sobre el eje del scroll. En 0 todavía no se midió. */
  pageSize: number;
  scrollRef: React.RefObject<ScrollView | null>;
  autoPlayPaused: boolean;
  /** El sistema pidió reducir movimiento: no hay autoPlay ni transiciones. */
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
 * Todo lo que en `Slides` no se ve: qué página está encuadrada, cuándo mover el
 * scroll, cómo se mapean los clones del modo infinito a índices reales, y el
 * reloj del avance automático.
 *
 * Trabaja sólo con índices, nunca con los ítems: así no necesita el genérico
 * `T` del componente, y el UI resuelve `pages[i].real` contra su propio `data`.
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
  // Un solo elemento no tiene a dónde ciclar: quedaría deslizable entre tres
  // copias de lo mismo.
  const isLoop = loop && total > 1;

  const [uncontrolled, setUncontrolled] = useState(() => clampIndex(defaultIndex, total));
  const active = clampIndex(index ?? uncontrolled, total);
  const activeRef = useRef(active);
  activeRef.current = active;

  const [autoPlayPaused, setAutoPlayPaused] = useState(false);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const pageSize = isHorizontal ? size.width : size.height;

  const scrollRef = useRef<ScrollView>(null);
  /** Página realmente visible (índice dentro de `pages`, clones incluidos). */
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

  // Sólo actúa cuando el índice y la página visible discrepan: un cambio que
  // vino del propio gesto no dispara un segundo scroll encima del que frenó.
  useEffect(() => {
    if (pageSize === 0 || total === 0) return;
    const target = isLoop ? active + 1 : active;
    const resized = lastPageSizeRef.current !== pageSize;
    if (offsetPageRef.current === target && didInitRef.current && !resized) return;
    // Ni el primer posicionamiento ni el reacomodo por rotación son un cambio
    // de slide: animarlos sería un deslizamiento que nadie pidió.
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
    // Un arrastre corto puede soltarse sin inercia y no emitir
    // momentumScrollEnd: sin esto el autoPlay quedaría pausado para siempre.
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
      // Última en modo infinito: avanza al clon de la primera en vez de
      // rebobinar; el salto al original lo cierra momentumScrollEnd.
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
