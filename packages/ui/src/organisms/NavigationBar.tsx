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
  /** Shows the label under each icon. @default true */
  showLabels?: boolean;
  /** Adds the safe area inset for the edge where the bar lives. @default true */
  safeArea?: boolean;
  /**
   * Hides a bottom bar while the keyboard is open, like native tab bars, so
   * it doesn't sit between the field and the keyboard. Only Android needs it:
   * on iOS the keyboard already covers the bar. @default true
   */
  hideOnKeyboard?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/** Counter badge: a pill that still fits two digits over a 22pt icon. */
const BADGE_SIZE = 16;
const BADGE_DOT_SIZE = 10;
const BADGE_FONT_SIZE = 10;
/** Indicator spring: settles fast without bouncing past the tab. */
const INDICATOR_SPRING = { friction: 9, tension: 90 };

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
  item: { flex: 1, paddingVertical: theme.tokens.spacing.xs },
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
 * It doesn't navigate on its own — it reports the tapped tab and the consumer decides.
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

    const renderContent = (item: NavigationBarItem, color: string) => (
      <>
        {!!item.iconName && <Icon name={item.iconName} size={ICON_SIZE} color={color} />}
        {showLabels && (
          <Text allowFontScaling={allowFontScaling} numberOfLines={1} style={[styles.label, { color }]}>
            {item.label}
          </Text>
        )}
      </>
    );

    if (keyboardOpen) return null;

    return (
      <View
        testID={testID}
        onLayout={onLayout}
        accessibilityRole="tablist"
        style={[
          styles.bar,
          position === 'bottom' ? styles.barBottom : styles.barTop,
          safeArea && position === 'bottom' && { paddingBottom: theme.tokens.spacing.sm + insets.bottom },
          safeArea && position === 'top' && { paddingTop: theme.tokens.spacing.sm + insets.top },
          style,
        ]}
      >
        {itemWidth > 0 && (
          <Animated.View
            testID="navigation-bar-indicator"
            pointerEvents="none"
            style={[
              styles.indicator,
              safeArea && position === 'bottom' && { bottom: theme.tokens.spacing.xs + insets.bottom },
              safeArea && position === 'top' && { top: theme.tokens.spacing.xs + insets.top },
              {
                width: itemWidth - theme.tokens.spacing.sm * 2,
                transform: [{ translateX: slide }],
              },
            ]}
          />
        )}

        {items.map((item, index) => {
          const active = index === activeIndex;
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
              style={styles.item}
              activeOpacity={0.7}
              onPress={() => onChange(item.key)}
              accessibilityRole="tab"
              accessibilityLabel={item.label}
              accessibilityState={{ selected: active }}
              // The badge is drawn, not text the reader reaches: its count goes in the value.
              accessibilityValue={typeof item.badge === 'number' || typeof item.badge === 'string' ? { text: String(item.badge) } : undefined}
            >
              <Animated.View style={[styles.itemContent, { transform: [{ scale }] }]}>
                {renderContent(item, colors.textLight)}
                {/* Decorative copy: if it weren't hidden, the reader would read the label twice. */}
                <Animated.View
                  pointerEvents="none"
                  accessibilityElementsHidden
                  importantForAccessibility="no-hide-descendants"
                  style={[StyleSheet.absoluteFill, styles.itemContent, { opacity: activeOpacity }]}
                >
                  {renderContent(item, colors.primaryText)}
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
  }
);
NavigationBar.displayName = 'NavigationBar';
