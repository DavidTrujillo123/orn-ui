import React, { memo, useMemo } from 'react';
import { type StyleProp, type ViewStyle } from 'react-native';
import { useThemeMode, type ThemeMode } from '../theme/UIProvider';
import { SegmentedControl } from '../molecules/SegmentedControl';

export interface ThemeToggleProps {
  style?: StyleProp<ViewStyle>;
  labels?: Partial<Record<ThemeMode, string>>;
  testID?: string;
}

const MODES: ThemeMode[] = ['system', 'light', 'dark'];
const DEFAULT_LABELS: Record<ThemeMode, string> = { system: 'Auto', light: 'Light', dark: 'Dark' };

/**
 * ThemeToggle
 * Conecta un SegmentedControl con UIProvider.setMode. Sin persistencia — el
 * consumidor la resuelve vía onModeChange en <UIProvider>.
 */
export const ThemeToggle = memo(({ style, labels: labelOverrides, testID }: ThemeToggleProps) => {
  const { mode, setMode } = useThemeMode();

  const options = useMemo(() => {
    const labels = { ...DEFAULT_LABELS, ...labelOverrides };
    return MODES.map((value) => ({ value, label: labels[value] }));
  }, [labelOverrides]);

  return <SegmentedControl options={options} value={mode} onChange={setMode} style={style} testID={testID} />;
});
ThemeToggle.displayName = 'ThemeToggle';
