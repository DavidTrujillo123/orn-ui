import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Screen, Title, Caption, IconButton } from 'orn-ui';
import { useRouter, type Href } from 'expo-router';
import type { DemoEntry } from '@/demos/manifest';

export interface ComponentDetailScreenProps {
  entry: DemoEntry | undefined;
  /** Route of the list the back button returns to, e.g. "/molecules". */
  basePath: string;
}

/** A component's detail: back + name + description + its demo with its variants. */
export function ComponentDetailScreen({ entry, basePath }: ComponentDetailScreenProps) {
  const router = useRouter();

  // Explicit destination instead of "go back to the previous one": neither
  // router.back() (which walks the global history) nor navigation.goBack()
  // guarantee THIS category's list — after switching tabs the previous step
  // in the history is another tab, and back ended up in Atoms coming from a molecule.
  // dismissTo pops down to that list with the back animation; replace
  // (the direct entry path via deep link) switches the screen without animating.
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

  // Except for free-form flows, the demo takes all the remaining height:
  // inside lives a snapping pager (VariantList) that needs a fixed height per
  // page, and that is incompatible with a Screen that scrolls on its own.
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
  // Compact header: every point the intro takes is taken away from the pager's
  // page, which is where the component is looked at.
  intro: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 12, gap: 4 },
  description: { lineHeight: 18 },
  demoFill: { flex: 1 },
  notFound: { paddingHorizontal: 20, paddingTop: 20 },
});
