import React, { memo, useEffect, useRef, useState } from 'react';
import {
  Animated,
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
import { Icon } from '../icons/Icon';
import type { IconName } from '../icons/types';

export interface NavigationBarItem {
  key: string;
  label: string;
  iconName?: IconName;
  /** Contador sobre el ícono. `true` pinta sólo el punto. */
  badge?: number | string | true;
}

export interface NavigationBarProps {
  items: NavigationBarItem[];
  activeKey: string;
  onChange: (key: string) => void;
  /** Borde de la pantalla donde vive la barra. @default 'bottom' */
  position?: 'bottom' | 'top';
  /** @default true */
  showLabels?: boolean;
  /** Suma el inset de safe area del borde donde vive la barra. @default true */
  safeArea?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

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
    left: theme.tokens.spacing.sm,
    borderRadius: theme.tokens.radius.lg,
    backgroundColor: theme.colors.primarySoft,
  },
  item: { flex: 1, paddingVertical: theme.tokens.spacing.xs },
  itemContent: { alignItems: 'center', justifyContent: 'center', gap: 2 },
  label: { fontSize: theme.tokens.fontSize.xs, fontWeight: theme.tokens.fontWeight.medium },
  badge: {
    position: 'absolute',
    top: -4,
    left: '50%',
    marginLeft: 4,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 4,
    borderRadius: theme.tokens.radius.full,
    backgroundColor: theme.colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeDot: { minWidth: 10, height: 10, top: -2, paddingHorizontal: 0 },
  badgeText: {
    fontSize: 10,
    fontWeight: theme.tokens.fontWeight.bold,
    color: theme.colors.onError,
  },
}));

const ICON_SIZE = 22;

/**
 * NavigationBar
 * Barra de navegación por pestañas con la misma apariencia y las mismas
 * transiciones en iOS y Android: el indicador se desliza hasta la pestaña
 * activa y su contenido crece y toma el color de acento con un cross-fade.
 * No navega por su cuenta — reporta la pestaña tocada y el consumidor decide.
 */
export const NavigationBar = memo(
  ({
    items,
    activeKey,
    onChange,
    position = 'bottom',
    showLabels = true,
    safeArea = true,
    style,
    testID,
  }: NavigationBarProps) => {
    const theme = useTheme();
    const colors = useColors();
    const styles = useStyles();
    const insets = useInsets();
    const allowFontScaling = useAllowFontScaling();

    const [barWidth, setBarWidth] = useState(0);
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
      // En el primer layout el indicador aparece en su lugar; animarlo desde 0
      // sería un deslizamiento que el usuario no pidió.
      if (!placed.current) {
        placed.current = true;
        slide.setValue(to);
        return;
      }
      Animated.spring(slide, { toValue: to, useNativeDriver: true, friction: 9, tension: 90 }).start();
    }, [activeIndex, itemWidth, slide]);

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
              // El safe area vive dentro del padding de la barra: sin descontarlo
              // el indicador se estira hasta el borde inferior de la pantalla.
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
            >
              <Animated.View style={[styles.itemContent, { transform: [{ scale }] }]}>
                {renderContent(item, colors.textLight)}
                {/* Copia decorativa: sin ocultarla, el lector lee el label dos veces. */}
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
