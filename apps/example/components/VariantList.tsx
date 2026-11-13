import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Keyboard,
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Caption, SegmentedControl, useColors } from 'orn-ui';
import { useLocalSearchParams } from 'expo-router';

export interface VariantDef {
  label: string;
  content: React.ReactNode;
}

/**
 * Demos with their own gestures (drag to reorder) compete with the pager's
 * and the stage's scroll: on iOS the `UIScrollView` cancels the content's
 * touches as soon as its vertical gesture starts and the drag dies. This
 * context lets them turn off both scrolls for the duration of the gesture.
 */
const ScrollLockContext = React.createContext<(locked: boolean) => void>(() => {});

export function useVariantScrollLock() {
  return useContext(ScrollLockContext);
}

export interface VariantListProps {
  variants: VariantDef[];
  fill?: boolean;
}

/**
 * VariantList
 * Full-screen vertical pager: one variant per page, swipe up / down with
 * snap. They used to be cards stacked in a free scroll; with snap each
 * variant is framed on its own, without being cut off mid-gesture or
 * competing visually with the next one.
 *
 * ScrollView with pagingEnabled, not FlatList: several demos mount their own
 * scrollers inside (calendars, forms) and nesting VirtualizedLists on the
 * same axis breaks virtualization and fires warnings at runtime.
 */
export function VariantList({ variants, fill = false }: VariantListProps) {
  const colors = useColors();
  const [pageHeight, setPageHeight] = useState(() => Dimensions.get('window').height);
  // `?v=N` (1-based) opens variant N directly: lets you review each variant via
  // deep link (`ornui:///atoms/typography?v=3`) without depending on a swipe.
  const { v } = useLocalSearchParams<{ v?: string }>();
  const initialIndex = Math.min(Math.max((parseInt(v ?? '', 10) || 1) - 1, 0), Math.max(variants.length - 1, 0));
  const [index, setIndex] = useState(initialIndex);
  const [scrollLocked, setScrollLocked] = useState(false);
  const hintOpacity = useRef(new Animated.Value(1)).current;
  const hintDismissed = useRef(false);
  const pagerRef = useRef<ScrollView>(null);
  const indexRef = useRef(initialIndex);
  const keyboardOpen = useRef(false);

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    if (keyboardOpen.current) return;
    setPageHeight(e.nativeEvent.layout.height);
  }, []);

  const snapToCurrent = useCallback(() => {
    if (pageHeight <= 0) return;
    pagerRef.current?.scrollTo({ y: indexRef.current * pageHeight, animated: false });
  }, [pageHeight]);

  useEffect(snapToCurrent, [snapToCurrent]);

  useEffect(() => {
    const subs = [
      Keyboard.addListener('keyboardDidShow', () => {
        keyboardOpen.current = true;
        snapToCurrent();
      }),
      Keyboard.addListener('keyboardDidHide', () => {
        keyboardOpen.current = false;
        snapToCurrent();
      }),
    ];
    return () => subs.forEach((s) => s.remove());
  }, [snapToCurrent]);

  const onScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (hintDismissed.current || e.nativeEvent.contentOffset.y <= 0) return;
      hintDismissed.current = true;
      Animated.timing(hintOpacity, { toValue: 0, duration: 150, useNativeDriver: true }).start();
    },
    [hintOpacity],
  );

  const onMomentumEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (pageHeight <= 0) return;
      // Clamped: with `?v=N` the first scrollTo uses the window height and, once
      // the real page is measured, iOS trims the offset and fires this event with
      // an out-of-range index (blank page, no active tick).
      const next = Math.min(Math.max(Math.round(e.nativeEvent.contentOffset.y / pageHeight), 0), variants.length - 1);
      indexRef.current = next;
      setIndex(next);
    },
    [pageHeight, variants.length],
  );

  if (fill) {
    // One full-height stage, no pager (the content scrolls on its own): a
    // numbered switcher picks the variant, and `?v=N` opens it directly.
    const only = variants[index];
    return (
      <View style={styles.fillRoot}>
        {variants.length > 1 && (
          <SegmentedControl
            options={variants.map((_, i) => ({ value: String(i), label: String(i + 1) }))}
            value={String(index)}
            onChange={(next) => setIndex(Number(next))}
          />
        )}
        {!!only && (
          <>
            <Caption style={styles.label}>{only.label}</Caption>
            <View
              key={only.label}
              style={[styles.stage, styles.stageFill, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              {only.content}
            </View>
          </>
        )}
      </View>
    );
  }

  return (
    <ScrollLockContext.Provider value={setScrollLocked}>
      <View style={styles.pagerRoot} onLayout={onLayout}>
        {pageHeight > 0 && (
          <ScrollView
            ref={pagerRef}
            pagingEnabled
            scrollEnabled={!scrollLocked}
            showsVerticalScrollIndicator={false}
            decelerationRate="fast"
            keyboardShouldPersistTaps="handled"
            onScroll={onScroll}
            scrollEventThrottle={16}
            onMomentumScrollEnd={onMomentumEnd}
          >
            {variants.map((v, i) => {
              const isNear = Math.abs(i - index) <= 1;
              return (
                <View
                  key={v.label}
                  style={[styles.page, { height: pageHeight }]}
                  accessible={false}
                  accessibilityLabel={`Variant ${i + 1} of ${variants.length}: ${v.label}`}
                >
                  <Caption style={styles.label}>{v.label}</Caption>
                  <View style={[styles.stage, styles.stagePage, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    {isNear && (
                      <ScrollView
                        contentContainerStyle={styles.stageContent}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                        scrollEnabled={!scrollLocked}
                      >
                        {v.content}
                      </ScrollView>
                    )}
                  </View>
                </View>
              );
            })}
          </ScrollView>
        )}

        {variants.length > 1 && (
          <>
            <View style={styles.rail} pointerEvents="none">
              {variants.map((v, i) => (
                <View
                  key={v.label}
                  style={[
                    styles.tick,
                    {
                      backgroundColor: i === index ? colors.primary : colors.border,
                      height: i === index ? 18 : 6,
                    },
                  ]}
                />
              ))}
            </View>

            <Animated.View style={[styles.hint, { opacity: hintOpacity }]} pointerEvents="none">
              <Caption style={[styles.hintText, { color: colors.textLight }]}>
                Swipe to see the {variants.length} variants
              </Caption>
            </Animated.View>
          </>
        )}
      </View>
    </ScrollLockContext.Provider>
  );
}

/** Row of small examples side by side within the same `content`. */
export function VariantRow({ children }: { children: React.ReactNode }) {
  return <View style={styles.row}>{children}</View>;
}

const styles = StyleSheet.create({
  pagerRoot: { flex: 1 },
  page: { paddingHorizontal: 20, paddingBottom: 20, gap: 8 },
  fillRoot: { flex: 1, paddingHorizontal: 20, gap: 8 },
  label: { textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: '700' },
  stage: { borderRadius: 16, borderWidth: 1, justifyContent: 'center' },
  stagePage: { flex: 1 },
  stageFill: { flex: 1, padding: 20 },
  stageContent: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  rail: {
    position: 'absolute',
    right: 6,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  tick: { width: 3, borderRadius: 2 },
  hint: { position: 'absolute', left: 0, right: 0, bottom: 0, alignItems: 'center' },
  hintText: { fontSize: 11 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, alignItems: 'flex-start' },
});
