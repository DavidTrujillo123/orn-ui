import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Body, Caption, Icon, useColors } from 'orn-ui';

export function ComponentListItem({
  name,
  description,
  onPress,
}: {
  name: string;
  description: string;
  onPress: () => void;
}) {
  const colors = useColors();
  return (
    <TouchableOpacity style={[styles.row, { borderColor: colors.border }]} onPress={onPress} activeOpacity={0.6}>
      <View style={styles.text}>
        <Body style={styles.name}>{name}</Body>
        <Caption numberOfLines={1}>{description}</Caption>
      </View>
      <Icon name="chevron-right" size={18} color={colors.textLight} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    gap: 12,
  },
  text: { flex: 1, gap: 2 },
  name: { fontWeight: '600' },
});
