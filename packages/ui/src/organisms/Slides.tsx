import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { createStyles } from '../theme/createStyles';
import { useAllowFontScaling, useColors } from '../theme/UIProvider';
import { useReduceMotion } from '../atoms/Transition';
import { Gradient, type GradientDirection } from '../atoms/Gradient';

export type SlidesOrientation = 'horizontal' | 'vertical';
export type SlidesIndicators = 'dots' | 'numbers' | 'none';
export type SlidesIndicatorPlacement = 'overlay' | 'outside';

/** Un color sólido, o dos o más para un degradado (ver `Gradient`). */
export type SlideBackground = string | string[];

export interface SlidesProps<T> {
  data: T[];
  keyExtractor: (item: T, index: number) => string;
  /** Contenido de la slide: imágenes, botones, lo que sea. Se dibuja sobre `background`. */
  renderItem: (item: T, index: number) => React.ReactNode;
  /** Fondo por slide: `'#101014'` pinta plano, `['#004cef', '#00cae1']` degrada. */
  background?: (item: T, index: number) => SlideBackground | undefined;
  /** Dirección del degradado cuando `background` devuelve varios colores. @default 'vertical' */
  gradientDirection?: GradientDirection;
  /** @default 'horizontal' */
  orientation?: SlidesOrientation;
  /** Círculos, círculos numerados, o ninguno. @default 'dots' */
  indicators?: SlidesIndicators;
  /**
   * 'overlay' los apoya sobre la slide, en blanco; 'outside' los saca fuera
   * del área deslizable, con los colores del tema.
   * @default 'overlay'
   */
  indicatorPlacement?: SlidesIndicatorPlacement;
  /** Después de la última vuelve a la primera (y al revés). @default false */
  loop?: boolean;
  /** Avanza solo. Se pausa mientras el dedo arrastra. @default false */
  autoPlay?: boolean;
  /** ms entre avances de `autoPlay`. @default 4000 */
  interval?: number;
  /** Índice controlado. Sin él, el componente maneja el suyo desde `defaultIndex`. */
  index?: number;
  /** @default 0 */
  defaultIndex?: number;
  onIndexChange?: (index: number) => void;
  /** Alto del área deslizable. @default 240 */
  height?: number;
  /** @default true */
  swipeEnabled?: boolean;
  /** Estilos de cada slide — padding y alineación del contenido. */
  slideStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const DOT = 8;
const DOT_ACTIVE = 20;
const NUMBER_CIRCLE = 24;
const DEFAULT_HEIGHT = 240;
const DEFAULT_INTERVAL = 4000;

const useStyles = createStyles((theme) => ({
  // Deja redondear el bloque por `style` sin que el degradado se salga.
  root: { overflow: 'hidden' },
  viewport: { flex: 1 },
  // Con indicadores fuera y orientación vertical el contenedor es una fila:
  // sin flex la ventana no tiene ancho propio y colapsa a 0.
  viewportInRow: { flex: 1 },
  slideContent: { flex: 1 },

  indicatorsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  indicatorsColumn: { flexDirection: 'column', alignItems: 'center', justifyContent: 'center' },
  indicatorsOverlayHorizontal: { position: 'absolute', left: 0, right: 0, bottom: theme.tokens.spacing.md },
  indicatorsOverlayVertical: { position: 'absolute', top: 0, bottom: 0, right: theme.tokens.spacing.md },
  indicatorsOutsideHorizontal: { paddingTop: theme.tokens.spacing.md },
  indicatorsOutsideVertical: { paddingLeft: theme.tokens.spacing.md },
  indicatorSlot: { padding: theme.tokens.spacing.xs },

  dot: { width: DOT, height: DOT, borderRadius: DOT / 2 },
  dotActiveHorizontal: { width: DOT_ACTIVE },
  dotActiveVertical: { height: DOT_ACTIVE },

  numberCircle: {
    minWidth: NUMBER_CIRCLE,
    height: NUMBER_CIRCLE,
    borderRadius: NUMBER_CIRCLE / 2,
    borderWidth: 1,
    paddingHorizontal: theme.tokens.spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberText: { fontSize: theme.tokens.fontSize.xs, fontWeight: theme.tokens.fontWeight.semibold },

  outsideHorizontal: { flexDirection: 'column' },
  outsideVertical: { flexDirection: 'row' },
}));

function clampIndex(value: number, total: number): number {
  if (total === 0) return 0;
  if (value < 0) return 0;
  if (value > total - 1) return total - 1;
  return value;
}

/**
 * Slides
 * Carrusel con fondo propio (color plano o degradado) y contenido libre:
 * `renderItem` decide si adentro va una imagen, texto o botones.
 *
 * El deslizamiento es un `ScrollView` con `pagingEnabled` en vez de gestos a
 * mano: es lo único que da snap nativo en iOS y Android sin
 * `react-native-gesture-handler`, en todo el rango soportado (Expo SDK 54–57).
 *
 * Modo infinito por clones — la última slide antes de la primera y la primera
 * después de la última —: el dedo siempre cruza a un vecino real y el salto al
 * original ocurre con la animación terminada, así que no se ve ni rebobina
 * (continuidad).
 *
 * `autoPlay` se apaga si el sistema pide reducir movimiento.
 */
export function Slides<T>({
  data,
  keyExtractor,
  renderItem,
  background,
  gradientDirection = 'vertical',
  orientation = 'horizontal',
  indicators = 'dots',
  indicatorPlacement = 'overlay',
  loop = false,
  autoPlay = false,
  interval = DEFAULT_INTERVAL,
  index,
  defaultIndex = 0,
  onIndexChange,
  height = DEFAULT_HEIGHT,
  swipeEnabled = true,
  slideStyle,
  style,
  testID,
}: SlidesProps<T>) {
  const colors = useColors();
  const styles = useStyles();
  const allowFontScaling = useAllowFontScaling();
  const reduceMotion = useReduceMotion();

  const total = data.length;
  const isHorizontal = orientation === 'horizontal';
  // Un solo elemento no tiene a dónde ciclar: quedaría deslizable entre tres
  // copias de lo mismo.
  const isLoop = loop && total > 1;

  const [uncontrolled, setUncontrolled] = useState(() => clampIndex(defaultIndex, total));
  const active = clampIndex(index ?? uncontrolled, total);
  const activeRef = useRef(active);
  activeRef.current = active;

  const [size, setSize] = useState({ width: 0, height: 0 });
  const pageSize = isHorizontal ? size.width : size.height;

  const scrollRef = useRef<ScrollView>(null);
  /** Página realmente visible (índice dentro de `pages`, clones incluidos). */
  const offsetPageRef = useRef(isLoop ? 1 : 0);
  const didInitRef = useRef(false);
  const lastPageSizeRef = useRef(0);
  const draggingRef = useRef(false);

  const pages = useMemo(() => {
    if (!isLoop) return data.map((item, i) => ({ item, real: i, key: keyExtractor(item, i) }));
    const last = data[total - 1] as T;
    const first = data[0] as T;
    return [
      { item: last, real: total - 1, key: 'slides-clone-head' },
      ...data.map((item, i) => ({ item, real: i, key: keyExtractor(item, i) })),
      { item: first, real: 0, key: 'slides-clone-tail' },
    ];
  }, [data, isLoop, keyExtractor, total]);

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

  const commit = useCallback(
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
    const { width, height: measured } = event.nativeEvent.layout;
    setSize((prev) => (prev.width === width && prev.height === measured ? prev : { width, height: measured }));
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
          commit(total - 1);
          return;
        }
        if (page === total + 1) {
          offsetPageRef.current = 1;
          scrollToPage(1, false);
          commit(0);
          return;
        }
        offsetPageRef.current = page;
        commit(page - 1);
        return;
      }

      offsetPageRef.current = page;
      commit(clampIndex(page, total));
    },
    [commit, isHorizontal, isLoop, pageSize, scrollToPage, total]
  );

  const onScrollBeginDrag = useCallback(() => {
    draggingRef.current = true;
  }, []);

  const onScrollEndDrag = useCallback(() => {
    // Un arrastre corto puede soltarse sin inercia y no emitir
    // momentumScrollEnd: sin esto el autoPlay quedaría pausado para siempre.
    draggingRef.current = false;
  }, []);

  useEffect(() => {
    if (!autoPlay || reduceMotion || total < 2 || pageSize === 0) return;
    const timer = setInterval(() => {
      if (draggingRef.current) return;
      const from = activeRef.current;
      if (from < total - 1) {
        commit(from + 1);
        return;
      }
      if (!isLoop) return;
      // Última en modo infinito: avanza al clon de la primera en vez de
      // rebobinar; el salto al original lo cierra momentumScrollEnd.
      offsetPageRef.current = total + 1;
      scrollToPage(total + 1, true);
    }, interval);
    return () => clearInterval(timer);
  }, [autoPlay, commit, interval, isLoop, pageSize, reduceMotion, scrollToPage, total]);

  const renderBackground = (item: T, real: number) => {
    const value = background?.(item, real);
    if (!value) return null;
    if (Array.isArray(value)) {
      return <Gradient colors={value} direction={gradientDirection} style={StyleSheet.absoluteFill} />;
    }
    return <View style={[StyleSheet.absoluteFill, { backgroundColor: value }]} pointerEvents="none" />;
  };

  const isOverlay = indicatorPlacement === 'overlay';

  const renderIndicator = (position: number) => {
    const selected = position === active;

    if (indicators === 'numbers') {
      const numberColors = isOverlay
        ? {
            background: selected ? colors.white : 'transparent',
            border: colors.white,
            text: selected ? colors.black : colors.white,
          }
        : {
            background: selected ? colors.primary : 'transparent',
            border: selected ? colors.primary : colors.border,
            text: selected ? colors.onPrimary : colors.textLight,
          };
      return (
        <View
          style={[
            styles.numberCircle,
            { backgroundColor: numberColors.background, borderColor: numberColors.border },
          ]}
        >
          <Text allowFontScaling={allowFontScaling} style={[styles.numberText, { color: numberColors.text }]}>
            {position + 1}
          </Text>
        </View>
      );
    }

    const dotColor = isOverlay ? colors.white : selected ? colors.primary : colors.border;
    return (
      <View
        testID={`${testID ?? 'slides'}-dot-${position}`}
        style={[
          styles.dot,
          selected && (isHorizontal ? styles.dotActiveHorizontal : styles.dotActiveVertical),
          { backgroundColor: dotColor },
          // En overlay el fondo es del consumidor: el contraste lo da la
          // opacidad, no el color.
          isOverlay && !selected && { opacity: 0.45 },
        ]}
      />
    );
  };

  const renderIndicators = () => {
    if (indicators === 'none' || total < 2) return null;
    return (
      <View
        testID={`${testID ?? 'slides'}-indicators`}
        style={[
          isHorizontal ? styles.indicatorsRow : styles.indicatorsColumn,
          isOverlay
            ? isHorizontal
              ? styles.indicatorsOverlayHorizontal
              : styles.indicatorsOverlayVertical
            : isHorizontal
              ? styles.indicatorsOutsideHorizontal
              : styles.indicatorsOutsideVertical,
        ]}
        pointerEvents="box-none"
      >
        {data.map((item, position) => (
          <TouchableOpacity
            key={`indicator-${keyExtractor(item, position)}`}
            testID={`${testID ?? 'slides'}-indicator-${position}`}
            style={styles.indicatorSlot}
            activeOpacity={0.7}
            onPress={() => commit(position)}
            accessibilityRole="button"
            accessibilityLabel={`Slide ${position + 1} of ${total}`}
            accessibilityState={{ selected: position === active }}
          >
            {renderIndicator(position)}
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const viewport = (
    <View testID={testID} style={[styles.root, { height }, !isOverlay && !isHorizontal && styles.viewportInRow, isOverlay && style]} onLayout={onLayout}>
      <ScrollView
        ref={scrollRef}
        testID={`${testID ?? 'slides'}-scroll`}
        style={styles.viewport}
        horizontal={isHorizontal}
        pagingEnabled
        scrollEnabled={swipeEnabled && total > 1}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        onMomentumScrollEnd={onMomentumScrollEnd}
        onScrollBeginDrag={onScrollBeginDrag}
        onScrollEndDrag={onScrollEndDrag}
      >
        {pageSize > 0 &&
          pages.map(({ item, real, key }) => (
            <View key={key} style={[{ width: size.width, height: size.height }, slideStyle]}>
              {renderBackground(item, real)}
              <View style={styles.slideContent}>{renderItem(item, real)}</View>
            </View>
          ))}
      </ScrollView>
      {isOverlay && renderIndicators()}
    </View>
  );

  if (isOverlay) return viewport;

  return (
    <View style={[isHorizontal ? styles.outsideHorizontal : styles.outsideVertical, style]}>
      {viewport}
      {renderIndicators()}
    </View>
  );
}
