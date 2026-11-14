import React, { memo, useMemo } from 'react';
import { type StyleProp, type ViewStyle } from 'react-native';
import { useLabels, useThemeMode, type ThemeMode } from '../theme/UIProvider';
import { SegmentedControl } from '../molecules/SegmentedControl';

export interface ThemeToggleProps {
  style?: StyleProp<ViewStyle>;
  /** Text of each segment; any mode left out keeps its default (`labels.themeSystem`, `themeLight`, `themeDark`). */
  labels?: Partial<Record<ThemeMode, string>>;
  testID?: string;
}

const MODES: ThemeMode[] = ['system', 'light', 'dark'];

/**
 * ThemeToggle
 * Connects a SegmentedControl to UIProvider.setMode. No persistence — the
 * consumer handles it via onModeChange on <UIProvider>.
 *
 * Design: Jakob's law — the same Auto / Light / Dark choice as the system
 * settings, in that order; Hick's law — three options, nothing to configure.
 */
export const ThemeToggle = memo(({ style, labels: labelOverrides, testID }: ThemeToggleProps) => {
  const { mode, setMode } = useThemeMode();
  const providerLabels = useLabels();

  const options = useMemo(() => {
    const labels: Record<ThemeMode, string> = {
      system: providerLabels.themeSystem,
      light: providerLabels.themeLight,
      dark: providerLabels.themeDark,
      ...labelOverrides,
    };
    return MODES.map((value) => ({ value, label: labels[value] }));
  }, [labelOverrides, providerLabels]);

  return <SegmentedControl options={options} value={mode} onChange={setMode} style={style} testID={testID} />;
});
ThemeToggle.displayName = 'ThemeToggle';
