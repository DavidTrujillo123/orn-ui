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
import { Caption, useColors } from 'orn-ui';

export interface VariantDef {
  label: string;
  content: React.ReactNode;
}

/**
 * Los demos con gestos propios (arrastrar para reordenar) compiten con el
 * scroll del pager y el del stage: en iOS el `UIScrollView` cancela los toques
 * del contenido apenas su gesto vertical arranca y el arrastre muere. Este
 * contexto les deja apagar ambos scrolls mientras dura el gesto.
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
 * Pager vertical a pantalla completa: una variante por página, swipe arriba /
 * abajo con snap. Antes eran tarjetas apiladas en un scroll libre; con snap
 * cada variante queda encuadrada sola, sin quedar cortada a mitad de gesto ni
 * competir visualmente con la de al lado.
 *
 * ScrollView con pagingEnabled, no FlatList: varios demos montan scrollers
 * propios adentro (calendarios, formularios) y anidar VirtualizedLists en el
 * mismo eje rompe la virtualización y dispara warnings en runtime.
 */
export function VariantList({ variants, fill = false }: VariantListProps) {
  const colors = useColors();
  const [pageHeight, setPageHeight] = useState(() => Dimensions.get('window').height);
  const [index, setIndex] = useState(0);
  const [scrollLocked, setScrollLocked] = useState(false);
  const hintOpacity = useRef(new Animated.Value(1)).current;
  const hintDismissed = useRef(false);
  const pagerRef = useRef<ScrollView>(null);
  const indexRef = useRef(0);
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
      const next = Math.round(e.nativeEvent.contentOffset.y / pageHeight);
      indexRef.current = next;
      setIndex(next);
    },
    [pageHeight],
  );

  if (fill) {
    const only = variants[0];
    return (
      <View style={styles.fillRoot}>
        {!!only && (
          <>
            <Caption style={styles.label}>{only.label}</Caption>
            <View style={[styles.stage, styles.stageFill, { backgroundColor: colors.surface, borderColor: colors.border }]}>
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

/** Fila de ejemplos chicos lado a lado dentro de un mismo `content`. */
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
