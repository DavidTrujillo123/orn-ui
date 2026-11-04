import React, { memo, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  I18nManager,
  Text,
  TouchableOpacity,
  View,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { createStyles } from '../theme/createStyles';
import { useAllowFontScaling, useTheme } from '../theme/UIProvider';
import { useReduceMotion } from '../theme/useReduceMotion';

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
  // One shared indicator slides under the segments; until the track is
  // measured, the selected segment paints this same fill itself.
  indicator: {
    position: 'absolute',
    top: TRACK_PADDING,
    bottom: TRACK_PADDING,
    start: TRACK_PADDING,
    borderRadius: theme.tokens.radius.sm,
  },
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
 *
 * Continuity: the selection is one indicator that slides from the old segment
 * to the new one, so the eye follows the change instead of seeing one fill
 * vanish and another appear. With Reduce Motion it jumps.
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
  const theme = useTheme();
  const allowFontScaling = useAllowFontScaling();
  const reduceMotion = useReduceMotion();
  const [trackWidth, setTrackWidth] = useState(0);
  const offset = useRef(new Animated.Value(0)).current;
  const placed = useRef(false);

  const index = options.findIndex((option) => option.value === value);
  const segmentWidth = trackWidth > 0 && options.length > 0 ? (trackWidth - TRACK_PADDING * 2) / options.length : 0;
  const showIndicator = segmentWidth > 0 && index >= 0;
  // transform isn't mirrored in RTL: the indicator starts at the right edge
  // (`start`), so it moves left.
  const target = index * segmentWidth * (I18nManager.isRTL ? -1 : 1);

  useEffect(() => {
    if (!showIndicator) return;
    // First placement (and Reduce Motion) jumps; only a change of value slides.
    if (!placed.current || reduceMotion) {
      placed.current = true;
      offset.setValue(target);
      return;
    }
    const animation = Animated.timing(offset, {
      toValue: target,
      duration: theme.tokens.duration.base,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [target, showIndicator, reduceMotion, offset, theme.tokens.duration.base]);

  // A new width (rotation, resize) places the indicator without animating.
  const onLayout = (e: LayoutChangeEvent) => {
    const width = e.nativeEvent.layout.width;
    if (width === trackWidth) return;
    placed.current = false;
    setTrackWidth(width);
  };

  const activeDisabled = disabled || !!options[index]?.disabled;

  return (
    <View style={[styles.track, style]} accessibilityRole="radiogroup" testID={testID} onLayout={onLayout}>
      {showIndicator && (
        <Animated.View
          pointerEvents="none"
          testID={testID && `${testID}-indicator`}
          style={[
            styles.indicator,
            styles.segmentActive,
            { width: segmentWidth, transform: [{ translateX: offset }] },
            activeDisabled && styles.segmentDisabled,
          ]}
        />
      )}
      {options.map((option) => {
        const active = option.value === value;
        const isDisabled = disabled || !!option.disabled;
        return (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.segment,
              active && !showIndicator && styles.segmentActive,
              isDisabled && styles.segmentDisabled,
            ]}
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
