import React, { memo } from 'react';
import { Text, TouchableOpacity, View, type StyleProp, type ViewStyle } from 'react-native';
import { createStyles } from '../theme/createStyles';
import { useAllowFontScaling } from '../theme/UIProvider';

export interface SegmentedControlOption<T extends string = string> {
  value: T;
  /** Visible text. Kept to one line (ellipsized); screen readers get it whole. */
  label: string;
  /** Disables only this segment. */
  disabled?: boolean;
}

export interface SegmentedControlProps<T extends string = string> {
  /** The choices, all visible at once. Two to four read best (Hick); more belong in a Select. */
  options: SegmentedControlOption<T>[];
  /** The selected option's value. */
  value: T;
  /** Called with the new value; not called when pressing the segment already selected. */
  onChange: (value: T) => void;
  /** Disables the whole control. @default false */
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/** Inset between the track and the segments. */
const TRACK_PADDING = 3;
/** Minimum touch target (Fitts): the segment plus the track inset reach it. */
const MIN_TOUCH = 44;
const DISABLED_OPACITY = 0.5;
const HIT_SLOP = { top: TRACK_PADDING, bottom: TRACK_PADDING };

const useStyles = createStyles((theme) => ({
  track: {
    flexDirection: 'row',
    backgroundColor: theme.colors.inputBackground,
    borderRadius: theme.tokens.radius.md,
    padding: TRACK_PADDING,
  },
  segment: {
    flex: 1,
    minHeight: MIN_TOUCH - TRACK_PADDING * 2,
    paddingVertical: theme.tokens.spacing.sm,
    paddingHorizontal: theme.tokens.spacing.xs,
    borderRadius: theme.tokens.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Light: a white segment with a shadow over the grey track. Dark: shadows
  // don't show and `surface` is darker than the track (the segment looked
  // sunken), so the selected one takes the soft accent fill instead.
  segmentActive:
    theme.scheme === 'dark'
      ? { backgroundColor: theme.colors.primarySoft }
      : { backgroundColor: theme.colors.surface, ...theme.tokens.shadow.sm },
  segmentDisabled: { opacity: DISABLED_OPACITY },
  label: {
    fontSize: theme.tokens.fontSize.md,
    lineHeight: theme.tokens.lineHeight.md,
    fontWeight: theme.tokens.fontWeight.medium,
    color: theme.colors.textLight,
  },
  labelActive: { color: theme.colors.primaryText, fontWeight: theme.tokens.fontWeight.semibold },
}));

/**
 * SegmentedControl
 * Picks one option among a few, all visible. It knows no global state:
 * it receives `value` and reports through `onChange`.
 *
 * Gestalt, common region: one track holds every segment, so they read as a
 * single question. Similarity: equal widths and one line each, so no option
 * looks more important. Figure-ground: the selected segment is raised (surface
 * + shadow) above the sunken track; in dark, where shadows vanish, it takes
 * the soft accent fill. Fitts: every segment reaches 44pt.
 */
function SegmentedControlInner<T extends string>({
  options,
  value,
  onChange,
  disabled = false,
  style,
  testID,
}: SegmentedControlProps<T>) {
  const styles = useStyles();
  const allowFontScaling = useAllowFontScaling();

  return (
    <View style={[styles.track, style]} accessibilityRole="radiogroup" testID={testID}>
      {options.map((option) => {
        const active = option.value === value;
        const isDisabled = disabled || !!option.disabled;
        return (
          <TouchableOpacity
            key={option.value}
            style={[styles.segment, active && styles.segmentActive, isDisabled && styles.segmentDisabled]}
            onPress={() => {
              if (!active) onChange(option.value);
            }}
            disabled={isDisabled}
            hitSlop={HIT_SLOP}
            accessibilityRole="radio"
            accessibilityState={{ selected: active, checked: active, disabled: isDisabled }}
            accessibilityLabel={option.label}
            testID={testID && `${testID}-${option.value}`}
          >
            <Text
              allowFontScaling={allowFontScaling}
              numberOfLines={1}
              style={[styles.label, active && styles.labelActive]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// memo() loses generics when wrapping: the cast restores them so that
// `value` and `onChange` stay tied to the union of `options`.
export const SegmentedControl = memo(SegmentedControlInner) as typeof SegmentedControlInner;
