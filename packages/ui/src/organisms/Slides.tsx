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
import { useAllowFontScaling, useColors, useLabels, useTheme } from '../theme/UIProvider';
import { useReduceMotion } from '../atoms/Transition';
import { Gradient, type GradientDirection } from '../atoms/Gradient';
import { useSlides, type SlidesOrientation } from './useSlides';

export type { SlidesOrientation } from './useSlides';
export type SlidesIndicators = 'dots' | 'numbers' | 'none';
export type SlidesIndicatorPlacement = 'overlay' | 'outside';

/** A solid color, or two or more for a gradient (see `Gradient`). */
export type SlideBackground = string | string[];

export interface SlidesProps<T> {
  /** One item per slide. */
  data: T[];
  /** Stable key per item. */
  keyExtractor: (item: T, index: number) => string;
  /** Slide content: images, buttons, anything. Drawn on top of `background`. */
  renderItem: (item: T, index: number) => React.ReactNode;
  /** Per-slide background: `'#101014'` paints flat, `['#004cef', '#00cae1']` paints a gradient. */
  background?: (item: T, index: number) => SlideBackground | undefined;
  /** Gradient direction when `background` returns several colors. @default 'vertical' */
  gradientDirection?: GradientDirection;
  /** Direction of the swipe. @default 'horizontal' */
  orientation?: SlidesOrientation;
  /** Dots, numbered dots, or none. @default 'dots' */
  indicators?: SlidesIndicators;
  /**
   * 'overlay' places them on the slide, in white; 'outside' moves them out of
   * the swipeable area, in theme colors.
   * @default 'overlay'
   */
  indicatorPlacement?: SlidesIndicatorPlacement;
  /** After the last slide, wraps to the first (and vice versa). @default false */
  loop?: boolean;
  /** Advances automatically. Pauses while a finger is dragging. @default false */
  autoPlay?: boolean;
  /** Milliseconds between `autoPlay` advances. @default 4000 */
  interval?: number;
  /**
   * Button that pauses auto-advance. Only shown with `autoPlay`; on by default
   * because content that moves on its own needs a way to pause it
   * (WCAG 2.2.2).
   * @default true
   */
  showAutoPlayToggle?: boolean;
  /** Gap between slides, in px. At 0 they touch. @default 0 */
  spacing?: number;
  /** Controlled index. Without it, the component manages its own from `defaultIndex`. */
  index?: number;
  /** Starting slide when the index is uncontrolled. @default 0 */
  defaultIndex?: number;
  /** Called with the new index when the active slide changes. */
  onIndexChange?: (index: number) => void;
  /** Height of the swipeable area. @default 240 */
  height?: number;
  /**
   * Lets the user swipe between slides. When false, they change only through the indicators,
   * `autoPlay` or `index`. @default true
   */
  swipeEnabled?: boolean;
  /** Styles for each slide's visible box — padding, alignment, radius. */
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
  // Lets the block be rounded via `style` without the gradient spilling out.
  root: { overflow: 'hidden' },
  viewport: { flex: 1 },
  // The visible slide is the inner box: with `spacing` the page is wider
  // than it, and the background has to be clipped here and not on the page, or
  // the gradient paints the gap too.
  slide: { flex: 1, overflow: 'hidden' },
  // With indicators outside and vertical orientation the container is a row:
  // without flex the window has no width of its own and collapses to 0.
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
  // Triangle made of borders: a "play" without SVG or an icon set.
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
  /** In overlay the contrast comes from opacity; outside, from color. */
  overlay: boolean;
  activeColor: string;
  inactiveColor: string;
  testID?: string;
}

/**
 * The active dot stretches instead of jumping: an abrupt change reads as
 * "another dot appeared", not as "the same one moved". Width and color are
 * layout/paint props, so they go through the JS driver.
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
 * Carousel with its own background (flat color or gradient) and free-form
 * content: `renderItem` decides whether an image, text or buttons go inside.
 * The state lives in `useSlides`; only the tree is here.
 *
 * Sliding is a `ScrollView` with `pagingEnabled` instead of hand-made
 * gestures: it is the only thing that gives native snapping on iOS and
 * Android without `react-native-gesture-handler`, across the whole supported
 * range of Expo SDKs.
 *
 * Design:
 * - Jakob's law: native paging swipe and dots under the slide, like the
 *   system's own onboarding carousels.
 * - Similarity + Von Restorff: every indicator looks the same except the
 *   current one.
 * - Continuity: the slides slide (a jump with Reduce Motion, and autoPlay
 *   stops); infinite mode clones the edges so the swipe never rewinds.
 * - Fitts's law: indicators have padding around the dot as touch area.
 * - Screen readers: each indicator is "Slide n of total" (`labels.slideOf`),
 *   and autoPlay can be paused from its own button.
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
  const labels = useLabels();
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

  // With reduce-motion autoPlay is already off: there is nothing to pause.
  const renderAutoPlayToggle = () => {
    if (!autoPlay || !showAutoPlayToggle || motionReduced || total < 2) return null;
    return (
      <TouchableOpacity
        testID={`${testID ?? 'slides'}-autoplay-toggle`}
        style={[styles.autoPlayToggle, { backgroundColor: colors.black, opacity: 0.55 }]}
        activeOpacity={0.7}
        onPress={toggleAutoPlay}
        accessibilityRole="button"
        accessibilityLabel={autoPlayPaused ? labels.resumeSlides : labels.pauseSlides}
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
            accessibilityLabel={labels.slideOf.replace('{n}', String(position + 1)).replace('{total}', String(total))}
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
              // The gap is split on both sides of each page: that way the
              // separation between two slides is a full `spacing` and the page
              // still measures exactly what the ScrollView pages by.
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
