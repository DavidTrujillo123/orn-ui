import React, { memo, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Keyboard,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { createStyles } from '../theme/createStyles';
import { useAllowFontScaling, useColors, useInsets, useTheme } from '../theme/UIProvider';
import { useReduceMotion } from '../theme/useReduceMotion';
import { Icon } from '../icons/Icon';
import type { IconName } from '../icons/types';

export type NavigationBarVariant = 'fixed' | 'floating';

export interface NavigationBarItem {
  key: string;
  label: string;
  iconName?: IconName;
  /** Counter over the icon, also read by screen readers. `true` shows only the dot. */
  badge?: number | string | true;
}

export interface NavigationBarProps {
  /** The destinations: key, label, and optionally an icon and a badge. */
  items: NavigationBarItem[];
  /** Key of the selected item (controlled). */
  activeKey: string;
  /** Called with the key of the pressed item. */
  onChange: (key: string) => void;
  /** Screen edge where the bar lives. @default 'bottom' */
  position?: 'bottom' | 'top';
  /**
   * Shows the label under each icon. In the floating variant only the active
   * tab's label is shown. @default true
   */
  showLabels?: boolean;
  /** Adds the safe area inset for the edge where the bar lives. @default true */
  safeArea?: boolean;
  /**
   * Hides a bottom bar while the keyboard is open, like native tab bars, so
   * it doesn't sit between the field and the keyboard. Only Android needs it:
   * on iOS the keyboard already covers the bar. @default true
   */
  hideOnKeyboard?: boolean;
  /**
   * Bar treatment. 'fixed' is a full-width bar; 'floating' is a centered pill
   * above the bottom edge. @default 'fixed'
   */
  variant?: NavigationBarVariant;
  /** Caps the width of the floating pill, e.g. on a tablet. */
  maxWidth?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/** Counter badge: a pill that still fits two digits over a 22pt icon. */
const BADGE_SIZE = 16;
const BADGE_DOT_SIZE = 10;
const BADGE_FONT_SIZE = 10;
/** Indicator spring: settles fast without bouncing past the tab. */
const INDICATOR_SPRING = { friction: 9, tension: 90 };
/** Floating pill: a 44pt tab plus its label, with room to breathe. */
const FLOATING_BAR_HEIGHT = 64;
/** Outline that keeps the pill visible in dark, where shadows don't show. */
const FLOATING_BORDER_WIDTH = 1;
/** Above the content, below overlays such as sheets and modals. */
const FLOATING_Z_INDEX = 20;

const useStyles = createStyles((theme) => ({
  bar: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.tokens.spacing.xs,
    paddingVertical: theme.tokens.spacing.sm,
  },
  barBottom: { borderTopWidth: StyleSheet.hairlineWidth },
  barTop: { borderBottomWidth: StyleSheet.hairlineWidth },
  // Floating: the bar stops spanning the screen and becomes one shape among
  // the content, so it needs its own surface, radius and elevation.
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    zIndex: FLOATING_Z_INDEX,
  },
  rowFloating: {
    alignItems: 'center',
    paddingHorizontal: theme.tokens.spacing.lg,
    paddingBottom: theme.tokens.spacing.md,
  },
  barFloating: {
    width: '100%',
    height: FLOATING_BAR_HEIGHT,
    borderRadius: theme.tokens.radius.full,
    justifyContent: 'space-between',
    ...theme.tokens.shadow.lg,
  },
  indicator: {
    position: 'absolute',
    top: theme.tokens.spacing.xs,
    bottom: theme.tokens.spacing.xs,
    // The indicator is positioned against the bar's edge, not its inner box:
    // the horizontal padding has to be added to `left` so it sits centered
    // over the tab and not shifted to the left.
    left: theme.tokens.spacing.xs + theme.tokens.spacing.sm,
    borderRadius: theme.tokens.radius.lg,
    backgroundColor: theme.colors.primarySoft,
  },
  indicatorFloating: {
    top: theme.tokens.spacing.sm,
    bottom: theme.tokens.spacing.sm,
    left: theme.tokens.spacing.xs * 2,
    borderRadius: theme.tokens.radius.full,
  },
  item: { flex: 1, paddingVertical: theme.tokens.spacing.xs },
  // The floating bar has a fixed height, so the tab columns must center their
  // content in it; otherwise everything sits at the top and leaves a hole
  // under the row (worse with only the active label visible).
  itemFloating: { justifyContent: 'center' },
  itemContent: { alignItems: 'center', justifyContent: 'center', gap: theme.tokens.spacing.xxs },
  label: { fontSize: theme.tokens.fontSize.xs, fontWeight: theme.tokens.fontWeight.medium },
  badge: {
    position: 'absolute',
    top: -theme.tokens.spacing.xs,
    left: '50%',
    marginLeft: theme.tokens.spacing.xs,
    minWidth: BADGE_SIZE,
    height: BADGE_SIZE,
    paddingHorizontal: theme.tokens.spacing.xs,
    borderRadius: theme.tokens.radius.full,
    backgroundColor: theme.colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeDot: { minWidth: BADGE_DOT_SIZE, height: BADGE_DOT_SIZE, top: -theme.tokens.spacing.xxs, paddingHorizontal: 0 },
  badgeText: {
    fontSize: BADGE_FONT_SIZE,
    fontWeight: theme.tokens.fontWeight.bold,
    color: theme.colors.onError,
  },
}));

const ICON_SIZE = 22;

/**
 * NavigationBar
 * Tab navigation bar with the same look and the same transitions on iOS and
 * Android: the indicator slides to the active tab and its content grows and
 * takes the accent color with a cross-fade.
 * With `variant="floating"` the bar is a centered pill above the bottom edge
 * and only the active tab shows its label. It doesn't navigate on its own —
 * it reports the tapped tab and the consumer decides.
 *
 * Design:
 * - Jakob's law: the tab bar people know from every app, at the bottom by
 *   default, icon over label.
 * - Similarity + Von Restorff: every tab looks the same except the active
 *   one, which alone gets the accent and the indicator.
 * - Continuity: the indicator slides from tab to tab instead of jumping
 *   (in place with Reduce Motion).
 * - Fitts's law: the whole column is the target, not just the icon.
 * - Hick's law: meant for 3–5 destinations.
 * - Proximity + figure/ground (floating): the pill gathers the destinations
 *   and its shadow separates them from whatever scrolls underneath; showing
 *   only the active label keeps one focal point (Von Restorff).
 */
export const NavigationBar = memo(
  ({
    items,
    activeKey,
    onChange,
    position = 'bottom',
    showLabels = true,
    safeArea = true,
    hideOnKeyboard = true,
    variant = 'fixed',
    maxWidth,
    style,
    testID,
  }: NavigationBarProps) => {
    const theme = useTheme();
    const colors = useColors();
    const styles = useStyles();
    const insets = useInsets();
    const allowFontScaling = useAllowFontScaling();
    const reduceMotion = useReduceMotion();

    const [barWidth, setBarWidth] = useState(0);
    const [keyboardOpen, setKeyboardOpen] = useState(false);

    // On Android the window shrinks with the keyboard and the bar would end up
    // floating above it, between the field and the keys. On iOS the keyboard
    // covers it: no need (and hiding it would move the layout midway through
    // the keyboard animation).
    useEffect(() => {
      if (!hideOnKeyboard || position !== 'bottom' || Platform.OS !== 'android') return;
      const subs = [
        Keyboard.addListener('keyboardDidShow', () => setKeyboardOpen(true)),
        Keyboard.addListener('keyboardDidHide', () => setKeyboardOpen(false)),
      ];
      return () => subs.forEach((sub) => sub.remove());
    }, [hideOnKeyboard, position]);
    const slide = useRef(new Animated.Value(0)).current;
    const placed = useRef(false);

    const activeIndex = Math.max(
      0,
      items.findIndex((item) => item.key === activeKey)
    );
    const itemWidth = items.length > 0 ? barWidth / items.length : 0;

    useEffect(() => {
      if (itemWidth <= 0) return;
      const to = activeIndex * itemWidth;
      // On the first layout the indicator appears in place; animating it from 0
      // would be a slide the user didn't ask for.
      // With Reduce Motion it moves without the slide, too.
      if (!placed.current || reduceMotion) {
        placed.current = true;
        slide.setValue(to);
        return;
      }
      Animated.spring(slide, { toValue: to, useNativeDriver: true, ...INDICATOR_SPRING }).start();
    }, [activeIndex, itemWidth, slide, reduceMotion]);

    const onLayout = (e: LayoutChangeEvent) => {
      const next = e.nativeEvent.layout.width - theme.tokens.spacing.xs * 2;
      if (next !== barWidth) setBarWidth(next);
    };

    const renderContent = (item: NavigationBarItem, color: string, withLabel: boolean) => (
      <>
        {!!item.iconName && <Icon name={item.iconName} size={ICON_SIZE} color={color} />}
        {withLabel && (
          <Text allowFontScaling={allowFontScaling} numberOfLines={1} style={[styles.label, { color }]}>
            {item.label}
          </Text>
        )}
      </>
    );

    if (keyboardOpen) return null;
    const floating = variant === 'floating';

    const bar = (
      <View
        testID={testID}
        onLayout={onLayout}
        accessibilityRole="tablist"
        style={[
          styles.bar,
          floating ? styles.barFloating : position === 'bottom' ? styles.barBottom : styles.barTop,
          safeArea && !floating && position === 'bottom' && { paddingBottom: theme.tokens.spacing.sm + insets.bottom },
          safeArea && !floating && position === 'top' && { paddingTop: theme.tokens.spacing.sm + insets.top },
          floating &&
            theme.scheme === 'dark' && {
              borderWidth: FLOATING_BORDER_WIDTH,
              borderColor: theme.colors.border,
            },
          style,
        ]}
      >
        {itemWidth > 0 && (
          <Animated.View
            testID="navigation-bar-indicator"
            pointerEvents="none"
            style={[
              styles.indicator,
              floating && styles.indicatorFloating,
              safeArea && !floating && position === 'bottom' && { bottom: theme.tokens.spacing.xs + insets.bottom },
              safeArea && !floating && position === 'top' && { top: theme.tokens.spacing.xs + insets.top },
              {
                width: itemWidth - (floating ? theme.tokens.spacing.xs * 2 : theme.tokens.spacing.sm * 2),
                transform: [{ translateX: slide }],
              },
            ]}
          />
        )}

        {items.map((item, index) => {
          const active = index === activeIndex;
          const withLabel = showLabels && (!floating || active);
          const range = [(index - 1) * itemWidth, index * itemWidth, (index + 1) * itemWidth];
          const scale =
            itemWidth > 0
              ? slide.interpolate({ inputRange: range, outputRange: [1, 1.08, 1], extrapolate: 'clamp' })
              : 1;
          const activeOpacity =
            itemWidth > 0
              ? slide.interpolate({ inputRange: range, outputRange: [0, 1, 0], extrapolate: 'clamp' })
              : 0;

          return (
            <TouchableOpacity
              key={item.key}
              style={[styles.item, floating && styles.itemFloating]}
              activeOpacity={0.7}
              onPress={() => onChange(item.key)}
              accessibilityRole="tab"
              accessibilityLabel={item.label}
              accessibilityState={{ selected: active }}
              // The badge is drawn, not text the reader reaches: its count goes in the value.
              accessibilityValue={typeof item.badge === 'number' || typeof item.badge === 'string' ? { text: String(item.badge) } : undefined}
            >
              <Animated.View style={[styles.itemContent, { transform: [{ scale }] }]}>
                {renderContent(item, colors.textLight, withLabel)}
                {/* Decorative copy: if it weren't hidden, the reader would read the label twice. */}
                <Animated.View
                  pointerEvents="none"
                  accessibilityElementsHidden
                  importantForAccessibility="no-hide-descendants"
                  style={[StyleSheet.absoluteFill, styles.itemContent, { opacity: activeOpacity }]}
                >
                  {renderContent(item, colors.primaryText, withLabel)}
                </Animated.View>

                {item.badge !== undefined && (
                  <View style={[styles.badge, item.badge === true && styles.badgeDot]}>
                    {item.badge !== true && (
                      <Text allowFontScaling={false} style={styles.badgeText}>
                        {item.badge}
                      </Text>
                    )}
                  </View>
                )}
              </Animated.View>
            </TouchableOpacity>
          );
        })}
      </View>
    );

    if (!floating) return bar;

    return (
      <View pointerEvents="box-none" style={styles.overlay} testID={testID && `${testID}-overlay`}>
        <View
          testID={testID && `${testID}-row`}
          pointerEvents="box-none"
          style={[
            styles.rowFloating,
            safeArea && { paddingBottom: theme.tokens.spacing.md + insets.bottom },
            maxWidth !== undefined && { width: '100%', maxWidth },
          ]}
        >
          {bar}
        </View>
      </View>
    );
  }
);
NavigationBar.displayName = 'NavigationBar';
