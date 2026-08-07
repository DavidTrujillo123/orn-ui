import React, { memo } from 'react';
import { Text, TouchableOpacity, View, type StyleProp, type ViewStyle } from 'react-native';
import { createStyles } from '../theme/createStyles';
import { useAllowFontScaling, useColors, useThemeMode, type ThemeMode } from '../theme/UIProvider';

export interface ThemeToggleProps {
  style?: StyleProp<ViewStyle>;
  labels?: Partial<Record<ThemeMode, string>>;
}

const MODES: ThemeMode[] = ['system', 'light', 'dark'];
const DEFAULT_LABELS: Record<ThemeMode, string> = { system: 'Auto', light: 'Light', dark: 'Dark' };

const useStyles = createStyles((theme) => ({
  track: {
    flexDirection: 'row',
    backgroundColor: theme.colors.inputBackground,
    borderRadius: theme.tokens.radius.md,
    padding: 3,
  },
  segment: {
    flex: 1,
    paddingVertical: theme.tokens.spacing.sm,
    borderRadius: theme.tokens.radius.sm,
    alignItems: 'center',
  },
  segmentActive: { backgroundColor: theme.colors.surface, ...theme.tokens.shadow.sm },
  label: { fontSize: theme.tokens.fontSize.sm, fontWeight: theme.tokens.fontWeight.medium, color: theme.colors.textLight },
  labelActive: { color: theme.colors.primary, fontWeight: theme.tokens.fontWeight.semibold },
}));

/**
 * ThemeToggle
 * Segmented control de 3 estados (system/light/dark) conectado a
 * UIProvider.setMode. Sin persistencia — el consumidor la resuelve vía
 * onModeChange en <UIProvider>.
 */
export const ThemeToggle = memo(({ style, labels: labelOverrides }: ThemeToggleProps) => {
  const { mode, setMode } = useThemeMode();
  const colors = useColors();
  const styles = useStyles();
  const allowFontScaling = useAllowFontScaling();
  const labels = { ...DEFAULT_LABELS, ...labelOverrides };

  return (
    <View style={[styles.track, style]} accessibilityRole="tablist">
      {MODES.map((m) => {
        const active = mode === m;
        return (
          <TouchableOpacity
            key={m}
            style={[styles.segment, active && styles.segmentActive]}
            onPress={() => setMode(m)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={labels[m]}
          >
            <Text allowFontScaling={allowFontScaling} style={[styles.label, active && styles.labelActive]}>
              {labels[m]}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
});
ThemeToggle.displayName = 'ThemeToggle';
