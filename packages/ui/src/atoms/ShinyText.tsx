import React, { memo, useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  Easing,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { createStyles } from '../theme/createStyles';
import { useAllowFontScaling, useTheme } from '../theme/UIProvider';
import { useReduceMotion } from './Transition';

export interface ShinyTextProps {
  /** The text to animate. Only a string: the effect needs the characters. */
  text: string;
  /** Milliseconds a single sweep takes end to end. @default 2400 */
  duration?: number;
  /** Pause between sweeps, in ms. @default 600 */
  delay?: number;
  /**
   * Width of the bright band as a fraction of the text, from 0 to 1. Small
   * values give a narrow glint, large ones a soft wave. @default 0.28
   */
  spread?: number;
  /** When false it renders plain text in `shineColor`. @default true */
  animated?: boolean;
  /** Resting color of the characters. Keep it readable on its own (WCAG AA): the shine is decorative. @default theme.colors.textLight */
  color?: string;
  /** Color of the band that travels across. @default theme.colors.primary */
  shineColor?: string;
  /** @default 'left' */
  align?: 'left' | 'center' | 'right';
  /** Typography only: `color` and `shineColor` win over any color set here. */
  style?: StyleProp<TextStyle>;
  testID?: string;
}

const DEFAULT_DURATION = 2400;
const DEFAULT_DELAY = 600;
const DEFAULT_SPREAD = 0.28;

const useStyles = createStyles((theme) => ({
  text: {
    fontSize: theme.tokens.fontSize.xl,
    lineHeight: theme.tokens.lineHeight.lg,
    fontWeight: theme.tokens.fontWeight.semibold,
    color: theme.colors.text,
  },
  row: { flexDirection: 'row', flexWrap: 'wrap' },
  // Only top/left: an absoluteFill would stretch the letter to the group's width
  // and realign it. Anchored to the corner it lands exactly on the one below.
  overlay: { position: 'absolute', top: 0, left: 0 },
  // A word and the spaces that follow it: line breaks happen between
  // groups, never between the letters of a word.
  group: { flexDirection: 'row' },
}));

const ALIGN: Record<'left' | 'center' | 'right', ViewStyle['justifyContent']> = {
  left: 'flex-start',
  center: 'center',
  right: 'flex-end',
};

/** A word with the spaces that follow it, and the index of its first letter. */
interface Group {
  start: number;
  chars: string[];
}

function toGroups(text: string): Group[] {
  const chars = Array.from(text);
  const groups: Group[] = [];
  let current: string[] = [];
  let start = 0;

  chars.forEach((char, index) => {
    if (current.length === 0) start = index;
    current.push(char);
    const next = chars[index + 1];
    // Closes the group when the run of spaces following the word ends:
    // that way the space travels with it and never starts a line on its own.
    const isSpace = /\s/.test(char);
    if (isSpace && next !== undefined && !/\s/.test(next)) {
      groups.push({ start, chars: current });
      current = [];
    }
  });
  if (current.length > 0) groups.push({ start, chars: current });

  return groups;
}

/**
 * ShinyText
 * A band of light sweeps across the text from left to right. Without
 * `background-clip: text` or masks —which React Native lacks in the supported
 * range— the shine is composed letter by letter: each one carries its resting
 * color and, overlaid on top, the same letter in the shine color with animated
 * opacity. The band is a moving interpolation window: the only thing that
 * changes per frame is `opacity`, which means the whole animation runs on the
 * native thread and JS takes part in no frame.
 *
 * Gestalt, common fate: the letters light up in sequence and at the same
 * rhythm, so they read as one moving thing —a word lighting up— and not as N
 * letters blinking on their own. That is why the band width is relative to
 * the text and not a fixed number of pixels: a long title and a short one take
 * the same time and are perceived the same.
 *
 * With "reduce motion" on, or with `animated={false}`, the text renders flat
 * in `shineColor` —legible, a single node and selectable— because the effect
 * is decorative and nothing it communicates lives in the shine.
 */
export const ShinyText = memo(
  ({
    text,
    duration = DEFAULT_DURATION,
    delay = DEFAULT_DELAY,
    spread = DEFAULT_SPREAD,
    animated = true,
    color,
    shineColor,
    align = 'left',
    style,
    testID,
  }: ShinyTextProps) => {
    const theme = useTheme();
    const styles = useStyles();
    const allowFontScaling = useAllowFontScaling();
    const reduceMotion = useReduceMotion();
    const progress = useRef(new Animated.Value(0)).current;

    const base = color ?? theme.colors.textLight;
    // The accent, not `text`: against `textLight` the difference is only in
    // luminance and the sweep is barely visible. The shine changes hue as well
    // as lightness, which is what makes the motion readable.
    const shine = shineColor ?? theme.colors.primary;
    const running = animated && !reduceMotion && text.length > 0;

    useEffect(() => {
      if (!running) return;
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(progress, {
            toValue: 1,
            duration,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.delay(delay),
        ])
      );
      loop.start();
      return () => loop.stop();
    }, [running, duration, delay, progress]);

    const groups = useMemo(() => (running ? toGroups(text) : []), [running, text]);

    if (!running) {
      return (
        <Text
          testID={testID}
          allowFontScaling={allowFontScaling}
          style={[styles.text, style, { color: shine, textAlign: align }]}
        >
          {text}
        </Text>
      );
    }

    const total = Array.from(text).length;
    // The band enters on the left and exits on the right, so the normalized
    // path measures 1 + 2·spread. `half` is half a band on that scale: the
    // stretch of progress a letter takes to light up.
    const half = spread / (1 + 2 * spread);

    return (
      <View
        testID={testID}
        accessible
        accessibilityRole="text"
        accessibilityLabel={text}
        style={[styles.row, { justifyContent: ALIGN[align] }]}
      >
        {groups.map((group) => (
          <View key={group.start} style={styles.group}>
            {group.chars.map((char, offset) => {
              const index = group.start + offset;
              const position = total === 1 ? 0.5 : index / (total - 1);
              // Progress at which the center of the band falls on this letter.
              const peak = (position + spread) / (1 + 2 * spread);
              const charStyle: StyleProp<TextStyle> = [styles.text, style];

              return (
                <View key={index}>
                  <Text allowFontScaling={allowFontScaling} style={[charStyle, { color: base }]}>
                    {char}
                  </Text>
                  <Animated.Text
                    allowFontScaling={allowFontScaling}
                    style={[
                      charStyle,
                      styles.overlay,
                      {
                        color: shine,
                        opacity: progress.interpolate({
                          inputRange: [peak - half, peak, peak + half],
                          outputRange: [0, 1, 0],
                          extrapolate: 'clamp',
                        }),
                      },
                    ]}
                  >
                    {char}
                  </Animated.Text>
                </View>
              );
            })}
          </View>
        ))}
      </View>
    );
  }
);
ShinyText.displayName = 'ShinyText';
