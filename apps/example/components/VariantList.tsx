import React from 'react';
import { StyleSheet, View } from 'react-native';
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
   * pueden apilarse varias en un scroll sin anidar VirtualizedLists.
   */
  fill?: boolean;
}

/**
 * VariantList
 * Todas las variantes apiladas verticalmente, cada una rotulada y sobre su
 * propio stage. Reemplazó a un selector de pills: con tabs arriba había que
 * volver a subir para cambiar de variante, y no se podían comparar dos de un
 * vistazo — que es justamente para lo que se mira un catálogo.
 */
export function VariantList({ variants, fill = false }: VariantListProps) {
  const colors = useColors();

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
    <View style={styles.list}>
      {variants.map((v) => (
        <View key={v.label} style={styles.item}>
          <Caption style={styles.label}>{v.label}</Caption>
          <View style={[styles.stage, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {v.content}
          </View>
        </View>
      ))}
    </View>
  );
}

/** Fila de ejemplos chicos lado a lado dentro de un mismo `content`. */
export function VariantRow({ children }: { children: React.ReactNode }) {
  return <View style={styles.row}>{children}</View>;
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: 20, gap: 24 },
  item: { gap: 8 },
  fillRoot: { flex: 1, paddingHorizontal: 20, gap: 8 },
  label: { textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: '700' },
  stage: { borderRadius: 16, borderWidth: 1, padding: 20, justifyContent: 'center' },
  stageFill: { flex: 1 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, alignItems: 'flex-start' },
});
