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
  // dismissTo desapila hasta esa lista con la animación de vuelta; replace
  // (el camino de entrada directa por deep link) cambia la pantalla sin animar.
  const goBack = () => {
    if (router.canDismiss()) router.dismissTo(basePath as Href);
    else router.replace(basePath as Href);
  };

  if (!entry) {
    return (
      <Screen scrollable={false} edges={['top']}>
        <View style={styles.navBar}>
          <IconButton iconName="chevron-left" accessibilityLabel="Back" onPress={goBack} />
        </View>
        <Caption style={styles.notFound}>This component does not exist.</Caption>
      </Screen>
    );
  }

  const { Demo } = entry;

  // Salvo los flujos libres, el demo se lleva todo el alto restante: adentro
  // vive un pager con snap (VariantList) que necesita una altura fija por
  // página, y eso es incompatible con un Screen que scrollea por su cuenta.
  const freeScroll = !!entry.freeScroll;

  return (
    <Screen
      scrollable={freeScroll}
      // The tab bar already covers the bottom safe area: repeating it here
      // leaves an empty band between the content and the bar.
      edges={['top']}
      // The back bar stays fixed while the content scrolls or moves up for the
      // keyboard (iOS large-title pattern: the name lives once, as the Title
      // below, not duplicated in the bar).
      header={
        <View style={styles.navBar}>
          <IconButton iconName="chevron-left" accessibilityLabel="Back" onPress={goBack} />
        </View>
      }
    >
      <View style={styles.intro}>
        <Title>{entry.name}</Title>
        <Caption style={styles.description}>{entry.description}</Caption>
      </View>

      <View style={freeScroll ? undefined : styles.demoFill}>
        <Demo />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  navBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, gap: 4 },
  // Header compacto: cada punto que se lleva el intro se lo saca a la página
  // del pager, que es donde se mira el componente.
  intro: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 12, gap: 4 },
  description: { lineHeight: 18 },
  demoFill: { flex: 1 },
  notFound: { paddingHorizontal: 20, paddingTop: 20 },
});
