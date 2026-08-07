import React, { useCallback, useRef, useState } from 'react';
import {
  Animated,
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

export interface VariantListProps {
  variants: VariantDef[];
  /**
   * Sólo la primera variante se muestra, ocupando todo el alto disponible.
   * Para demos que traen su propia lista virtualizada (List/SearchList): no
   * pueden vivir dentro del pager sin anidar scrollers verticales.
   */
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
  const [pageHeight, setPageHeight] = useState(0);
  const [index, setIndex] = useState(0);
  // El hint de swipe se retira apenas el usuario descubre el gesto: cumplida su
  // función, es ruido sobre el componente que se está mirando.
  const hintOpacity = useRef(new Animated.Value(1)).current;
  const hintDismissed = useRef(false);

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    setPageHeight(e.nativeEvent.layout.height);
  }, []);

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
      setIndex(Math.round(e.nativeEvent.contentOffset.y / pageHeight));
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
    <View style={styles.pagerRoot} onLayout={onLayout}>
      {/* Hasta tener el alto medido no se puede paginar: sin altura fija por
          página el snap cae en offsets arbitrarios. Un frame en blanco. */}
      {pageHeight > 0 && (
        <ScrollView
          pagingEnabled
          showsVerticalScrollIndicator={false}
          decelerationRate="fast"
          onScroll={onScroll}
          scrollEventThrottle={16}
          onMomentumScrollEnd={onMomentumEnd}
        >
          {variants.map((v, i) => (
            <View
              key={v.label}
              style={[styles.page, { height: pageHeight }]}
              accessible={false}
              accessibilityLabel={`Variante ${i + 1} de ${variants.length}: ${v.label}`}
            >
              <Caption style={styles.label}>{v.label}</Caption>
              <View style={[styles.stage, styles.stagePage, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                {/* El contenido se centra, pero una variante alta (calendarios)
                    scrollea dentro de su propia página en vez de recortarse. */}
                <ScrollView
                  contentContainerStyle={styles.stageContent}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                >
                  {v.content}
                </ScrollView>
              </View>
            </View>
          ))}
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
              Deslizá para ver las {variants.length} variantes
            </Caption>
          </Animated.View>
        </>
      )}
    </View>
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
  // Riel de progreso al borde derecho, fuera del stage: marca posición sin
  // robarle ancho al componente en exhibición.
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
