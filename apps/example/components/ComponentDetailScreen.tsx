import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Screen, Title, Caption, IconButton } from 'orn-ui';
import { useRouter, type Href } from 'expo-router';
import type { DemoEntry } from '@/demos/manifest';

export interface ComponentDetailScreenProps {
  entry: DemoEntry | undefined;
  /** Ruta de la lista a la que vuelve el back, ej. "/molecules". */
  basePath: string;
}

/** Detalle de un componente: back + nombre + descripción + su demo con sus variantes. */
export function ComponentDetailScreen({ entry, basePath }: ComponentDetailScreenProps) {
  const router = useRouter();

  // Destino explícito en vez de "volver al anterior": ni router.back() (que
  // recorre el historial global) ni navigation.goBack() garantizan la lista
  // de ESTA categoría — al cambiar de pestaña el paso previo del historial es
  // otra pestaña, y el back terminaba en Atoms viniendo de una molécula.
  // replace, no push: el detalle no debe quedar en el stack detrás de la lista.
  const goBack = () => router.replace(basePath as Href);

  if (!entry) {
    return (
      <Screen scrollable={false} edges={['top', 'bottom']}>
        <View style={styles.navBar}>
          <IconButton iconName="chevron-left" accessibilityLabel="Back" onPress={goBack} />
        </View>
        <Caption style={styles.notFound}>This component does not exist.</Caption>
      </Screen>
    );
  }

  const { Demo } = entry;

  return (
    // hostsList: el demo trae su propia FlatList, así que la pantalla no
    // scrollea (una VirtualizedList dentro de un ScrollView pierde la
    // virtualización y React Native lo advierte en runtime).
    <Screen
      scrollable={!entry.hostsList}
      // El demo trae su propio scroller con manejo de teclado; sumarle el del
      // Screen empuja el campo enfocado fuera de la pantalla.
      keyboardAvoiding={!entry.hostsList}
      edges={['top', 'bottom']}
    >
      {/* Patrón de título grande de iOS: la barra solo lleva el back, y el
          nombre vive una sola vez como Title debajo (no duplicado arriba). */}
      <View style={styles.navBar}>
        <IconButton iconName="chevron-left" accessibilityLabel="Back" onPress={goBack} />
      </View>

      <View style={styles.intro}>
        <Title>{entry.name}</Title>
        <Caption style={styles.description}>{entry.description}</Caption>
      </View>

      <View style={entry.hostsList ? styles.demoFill : undefined}>
        <Demo />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  navBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, gap: 4 },
  intro: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 20, gap: 4 },
  description: { lineHeight: 18 },
  demoFill: { flex: 1, paddingBottom: 20 },
  notFound: { paddingHorizontal: 20, paddingTop: 20 },
});
