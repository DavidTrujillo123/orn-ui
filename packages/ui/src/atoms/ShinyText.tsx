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
  /** Resting color of the characters. @default theme.colors.textLight */
  color?: string;
  /** Color of the band that travels across. @default theme.colors.text */
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
  // Sólo top/left: un absoluteFill estiraría la letra al ancho del grupo y la
  // volvería a alinear. Anclada a la esquina cae exactamente sobre la de abajo.
  overlay: { position: 'absolute', top: 0, left: 0 },
  // Una palabra y los espacios que la siguen: el salto de línea ocurre entre
  // grupos, nunca entre las letras de una palabra.
  group: { flexDirection: 'row' },
}));

const ALIGN: Record<'left' | 'center' | 'right', ViewStyle['justifyContent']> = {
  left: 'flex-start',
  center: 'center',
  right: 'flex-end',
};

/** Una palabra con los espacios que la siguen, y el índice de su primera letra. */
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
    // Cierra el grupo cuando termina la racha de espacios que sigue a la
    // palabra: así el espacio viaja con ella y no abre línea por sí solo.
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
 * Una banda de luz recorre el texto de izquierda a derecha. Sin
 * `background-clip: text` ni máscaras —que React Native no tiene en el rango
 * soportado— el brillo se compone letra por letra: cada una lleva su color de
 * reposo y encima, superpuesta, la misma letra en el color del brillo con la
 * opacidad animada. La banda es una ventana de interpolación que se desplaza:
 * lo que cambia por frame es sólo `opacity`, o sea que la animación entera
 * corre en el hilo nativo y JS no participa de ningún frame.
 *
 * Gestalt, destino común: las letras se encienden en secuencia y con el mismo
 * ritmo, así que se leen como una sola cosa que se mueve —una palabra
 * iluminándose— y no como N letras parpadeando por su cuenta. Por eso el ancho
 * de banda es relativo al texto y no una cantidad fija de píxeles: un título
 * largo y uno corto tardan lo mismo y se perciben igual.
 *
 * Con "reducir movimiento" activo, o con `animated={false}`, el texto se
 * renderiza plano en `shineColor` —legible, un solo nodo y seleccionable—
 * porque el efecto es decorativo y nada de lo que comunica está en el brillo.
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
    const shine = shineColor ?? theme.colors.text;
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
    // La banda entra por la izquierda y sale por la derecha, así que el
    // recorrido normalizado mide 1 + 2·spread. `half` es media banda en esa
    // escala: el tramo de progreso que una letra tarda en encenderse.
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
              // Progreso en el que el centro de la banda cae sobre esta letra.
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
