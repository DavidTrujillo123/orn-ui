import React, { memo, useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { createStyles } from '../theme/createStyles';
import { useAllowFontScaling, useColors, useTheme } from '../theme/UIProvider';
import { useReduceMotion } from '../atoms/Transition';
import { Gradient, type GradientDirection } from '../atoms/Gradient';
import { useSlides, type SlidesOrientation } from './useSlides';

export type { SlidesOrientation } from './useSlides';
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
  /**
   * Botón para frenar el avance automático. Sólo aparece con `autoPlay`, y va
   * en `true` porque contenido que se mueve solo necesita una forma de
   * pausarlo (WCAG 2.2.2).
   * @default true
   */
  showAutoPlayToggle?: boolean;
  /** Hueco entre slides, en px. En 0 quedan pegadas. @default 0 */
  spacing?: number;
  /** Índice controlado. Sin él, el componente maneja el suyo desde `defaultIndex`. */
  index?: number;
  /** @default 0 */
  defaultIndex?: number;
  onIndexChange?: (index: number) => void;
  /** Alto del área deslizable. @default 240 */
  height?: number;
  /** @default true */
  swipeEnabled?: boolean;
  /** Estilos de la caja visible de cada slide — padding, alineación, radio. */
  slideStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const DOT = 8;
const DOT_ACTIVE = 20;
const NUMBER_CIRCLE = 24;
const TOGGLE = 32;
const DEFAULT_HEIGHT = 240;
const DEFAULT_INTERVAL = 4000;

const useStyles = createStyles((theme) => ({
  // Deja redondear el bloque por `style` sin que el degradado se salga.
  root: { overflow: 'hidden' },
  viewport: { flex: 1 },
  // La slide visible es la caja de adentro: con `spacing` la página es más
  // ancha que ella, y el fondo tiene que recortarse acá y no en la página, o
  // el degradado pinta también el hueco.
  slide: { flex: 1, overflow: 'hidden' },
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

  autoPlayToggle: {
    position: 'absolute',
    top: theme.tokens.spacing.md,
    right: theme.tokens.spacing.md,
    width: TOGGLE,
    height: TOGGLE,
    borderRadius: TOGGLE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 3,
  },
  pauseBar: { width: 3, height: 12, borderRadius: 1 },
  // Triángulo con bordes: un "play" sin SVG ni set de íconos.
  playTriangle: {
    width: 0,
    height: 0,
    marginLeft: 2,
    borderTopWidth: 6,
    borderBottomWidth: 6,
    borderLeftWidth: 10,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
  },

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

interface DotProps {
  selected: boolean;
  isHorizontal: boolean;
  /** En overlay el contraste lo da la opacidad; afuera, el color. */
  overlay: boolean;
  activeColor: string;
  inactiveColor: string;
  testID?: string;
}

/**
 * El punto activo se estira en vez de saltar: el cambio de golpe se lee como
 * "apareció otro punto", no como "el mismo se movió". Ancho y color son props
 * de layout/pintura, así que van por el driver de JS.
 */
const Dot = memo(({ selected, isHorizontal, overlay, activeColor, inactiveColor, testID }: DotProps) => {
  const styles = useStyles();
  const theme = useTheme();
  const reduceMotion = useReduceMotion();
  const progress = useRef(new Animated.Value(selected ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: selected ? 1 : 0,
      duration: reduceMotion ? 0 : theme.tokens.duration.base,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();
  }, [progress, reduceMotion, selected, theme]);

  const length = progress.interpolate({ inputRange: [0, 1], outputRange: [DOT, DOT_ACTIVE] });
  const backgroundColor = progress.interpolate({ inputRange: [0, 1], outputRange: [inactiveColor, activeColor] });

  return (
    <Animated.View
      testID={testID}
      style={[
        styles.dot,
        isHorizontal ? { width: length } : { height: length },
        { backgroundColor },
        overlay && { opacity: progress.interpolate({ inputRange: [0, 1], outputRange: [0.45, 1] }) },
      ]}
    />
  );
});
Dot.displayName = 'SlidesDot';

/**
 * Slides
 * Carrusel con fondo propio (color plano o degradado) y contenido libre:
 * `renderItem` decide si adentro va una imagen, texto o botones. El estado
 * vive en `useSlides`; acá sólo está el árbol.
 *
 * El deslizamiento es un `ScrollView` con `pagingEnabled` en vez de gestos a
 * mano: es lo único que da snap nativo en iOS y Android sin
 * `react-native-gesture-handler`, en todo el rango soportado (Expo SDK 54–57).
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
  showAutoPlayToggle = true,
  spacing = 0,
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

  const total = data.length;
  const {
    active,
    pages,
    isHorizontal,
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
  } = useSlides({ total, orientation, loop, autoPlay, interval, index, defaultIndex, onIndexChange });

  const isOverlay = indicatorPlacement === 'overlay';

  const renderBackground = (item: T, real: number) => {
    const value = background?.(item, real);
    if (!value) return null;
    if (Array.isArray(value)) {
      return <Gradient colors={value} direction={gradientDirection} style={StyleSheet.absoluteFill} />;
    }
    return <View style={[StyleSheet.absoluteFill, { backgroundColor: value }]} pointerEvents="none" />;
  };

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

    return (
      <Dot
        testID={`${testID ?? 'slides'}-dot-${position}`}
        selected={selected}
        isHorizontal={isHorizontal}
        overlay={isOverlay}
        activeColor={isOverlay ? colors.white : colors.primary}
        inactiveColor={isOverlay ? colors.white : colors.border}
      />
    );
  };

  // Con reduce-motion el autoPlay ya está apagado: no hay nada que pausar.
  const renderAutoPlayToggle = () => {
    if (!autoPlay || !showAutoPlayToggle || motionReduced || total < 2) return null;
    return (
      <TouchableOpacity
        testID={`${testID ?? 'slides'}-autoplay-toggle`}
        style={[styles.autoPlayToggle, { backgroundColor: colors.black, opacity: 0.55 }]}
        activeOpacity={0.7}
        onPress={toggleAutoPlay}
        accessibilityRole="button"
        accessibilityLabel={autoPlayPaused ? 'Resume automatic slides' : 'Pause automatic slides'}
        accessibilityState={{ selected: !autoPlayPaused }}
      >
        {autoPlayPaused ? (
          <View style={[styles.playTriangle, { borderLeftColor: colors.white }]} />
        ) : (
          <>
            <View style={[styles.pauseBar, { backgroundColor: colors.white }]} />
            <View style={[styles.pauseBar, { backgroundColor: colors.white }]} />
          </>
        )}
      </TouchableOpacity>
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
            onPress={() => goTo(position)}
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
    <View
      testID={testID}
      style={[styles.root, { height }, !isOverlay && !isHorizontal && styles.viewportInRow, isOverlay && style]}
      onLayout={onLayout}
    >
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
          pages.map(({ real, clone }) => {
            const item = data[real] as T;
            return (
              // El hueco se reparte a los dos lados de cada página: así la
              // separación entre dos slides es `spacing` entero y la página
              // sigue midiendo exactamente lo que pagina el ScrollView.
              <View
                key={clone ? `slides-clone-${clone}` : keyExtractor(item, real)}
                style={[
                  { width: size.width, height: size.height },
                  isHorizontal ? { paddingHorizontal: spacing / 2 } : { paddingVertical: spacing / 2 },
                ]}
              >
                <View style={[styles.slide, slideStyle]}>
                  {renderBackground(item, real)}
                  <View style={styles.slideContent}>{renderItem(item, real)}</View>
                </View>
              </View>
            );
          })}
      </ScrollView>
      {renderAutoPlayToggle()}
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
