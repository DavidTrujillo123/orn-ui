import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Title, ThemeToggle } from 'orn-ui';

export function CategoryHeader({ title }: { title: string }) {
  return (
    <View style={styles.header}>
      <Title>{title}</Title>
      <ThemeToggle style={styles.toggle} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  toggle: { width: 180 },
});
