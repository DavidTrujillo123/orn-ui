import React, { memo } from 'react';
import { Text, View } from 'react-native';
import type { IconName, IconRenderProps } from './types';

/**
 * Glifos default dibujados con primitivas de RN (View + border + transform).
 * Cero dependencias, cero fuentes, cero carga asíncrona. Cubren únicamente
 * lo que la librería necesita internamente (checkbox, chevrons de Select,
 * toggle de password en Input, etc). Para íconos de producto, el consumidor
 * inyecta su propio set vía <UIProvider icons={...}> o la prop `icon`.
 */

const Chevron = memo(({ size, color, direction }: IconRenderProps & { direction: 'up' | 'down' | 'left' | 'right' }) => {
  const strokeWidth = Math.max(1.5, size / 12);
  const arm = size * 0.32;
  const rotation: Record<typeof direction, number> = {
    down: 45,
    up: 225,
    left: 135,
    right: -45,
  };
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View
        style={{
          width: arm,
          height: arm,
          borderRightWidth: strokeWidth,
          borderBottomWidth: strokeWidth,
          borderColor: color,
          transform: [{ rotate: `${rotation[direction]}deg` }, { translateY: -arm * 0.15 }],
        }}
      />
    </View>
  );
});
Chevron.displayName = 'Chevron';

const Check = memo(({ size, color }: IconRenderProps) => {
  const strokeWidth = Math.max(1.5, size / 10);
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View
        style={{
          width: size * 0.5,
          height: size * 0.28,
          borderLeftWidth: strokeWidth,
          borderBottomWidth: strokeWidth,
          borderColor: color,
          transform: [{ rotate: '-45deg' }, { translateY: -size * 0.06 }],
        }}
      />
    </View>
  );
});
Check.displayName = 'Check';

const Close = memo(({ size, color }: IconRenderProps) => {
  const strokeWidth = Math.max(1.5, size / 10);
  const line = size * 0.62;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View
        style={{
          position: 'absolute',
          width: line,
          height: strokeWidth,
          backgroundColor: color,
          borderRadius: strokeWidth / 2,
          transform: [{ rotate: '45deg' }],
        }}
      />
      <View
        style={{
          position: 'absolute',
          width: line,
          height: strokeWidth,
          backgroundColor: color,
          borderRadius: strokeWidth / 2,
          transform: [{ rotate: '-45deg' }],
        }}
      />
    </View>
  );
});
Close.displayName = 'Close';

const PlusMinus = memo(({ size, color, minusOnly }: IconRenderProps & { minusOnly?: boolean }) => {
  const strokeWidth = Math.max(1.5, size / 10);
  const line = size * 0.56;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View
        style={{
          position: 'absolute',
          width: line,
          height: strokeWidth,
          backgroundColor: color,
          borderRadius: strokeWidth / 2,
        }}
      />
      {!minusOnly && (
        <View
          style={{
            position: 'absolute',
            width: strokeWidth,
            height: line,
            backgroundColor: color,
            borderRadius: strokeWidth / 2,
          }}
        />
      )}
    </View>
  );
});
PlusMinus.displayName = 'PlusMinus';

/**
 * Círculo con un glifo tipográfico adentro (!, i, ?).
 *
 * Usa <Text> con la fuente del sistema en vez de componer el glifo con
 * Views: sigue siendo cero-dependencias (no carga ninguna fuente), y "i" vs
 * "!" vs "?" quedan inequívocos. Dibujarlos con barras y puntos daba un
 * "info" idéntico a un "!" invertido, que es exactamente lo que un ícono de
 * información no debe comunicar.
 */
const Circle = memo(
  ({ size, color, filled, label }: IconRenderProps & { filled?: boolean; label?: string }) => {
    const strokeWidth = Math.max(1.5, size / 12);
    return (
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: filled ? 0 : strokeWidth,
          borderColor: color,
          backgroundColor: filled ? color : 'transparent',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {!!label && (
          <Text
            allowFontScaling={false}
            style={{
              color: filled ? '#fff' : color,
              fontSize: size * 0.62,
              lineHeight: size * 0.74,
              fontWeight: '700',
              textAlign: 'center',
              includeFontPadding: false,
            }}
          >
            {label}
          </Text>
        )}
      </View>
    );
  }
);
Circle.displayName = 'Circle';

const Eye = memo(({ size, color, off }: IconRenderProps & { off?: boolean }) => {
  const strokeWidth = Math.max(1.5, size / 12);
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View
        style={{
          width: size * 0.8,
          height: size * 0.8,
          borderRadius: size * 0.4,
          borderWidth: strokeWidth,
          borderColor: color,
          overflow: 'hidden',
          alignItems: 'center',
          justifyContent: 'center',
          transform: [{ scaleY: 0.55 }],
        }}
      >
        <View
          style={{
            width: size * 0.26,
            height: size * 0.26,
            borderRadius: size * 0.13,
            backgroundColor: color,
            transform: [{ scaleY: 1 / 0.55 }],
          }}
        />
      </View>
      {off && (
        <View
          style={{
            position: 'absolute',
            width: size * 1.05,
            height: strokeWidth,
            backgroundColor: color,
            borderRadius: strokeWidth / 2,
            transform: [{ rotate: '-45deg' }],
          }}
        />
      )}
    </View>
  );
});
Eye.displayName = 'Eye';

const Search = memo(({ size, color }: IconRenderProps) => {
  const strokeWidth = Math.max(1.5, size / 9);
  // Lente grande (72% del alto) arriba-izquierda y mango corto saliendo de su
  // borde inferior-derecho sobre la diagonal de 45°. Las proporciones importan
  // a tamaños chicos (16-20px): con un lente chico y mango largo el glifo se
  // lee como una coma, no como una lupa.
  const lensD = size * 0.72;
  const lensR = lensD / 2;
  const handleLen = size * 0.34;
  const diag = Math.SQRT1_2; // cos(45°) === sin(45°)
  // El mango se centra sobre la diagonal, arrancando justo en el borde del
  // lente: distancia = radio + mitad del mango, menos un solapamiento de
  // medio trazo para que no quede un hueco entre borde y mango.
  const dist = lensR + handleLen / 2 - strokeWidth / 2;
  const cx = lensR + dist * diag;
  const cy = lensR + dist * diag;

  return (
    <View style={{ width: size, height: size }}>
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: lensD,
          height: lensD,
          borderRadius: lensR,
          borderWidth: strokeWidth,
          borderColor: color,
        }}
      />
      <View
        style={{
          position: 'absolute',
          left: cx - strokeWidth / 2,
          top: cy - handleLen / 2,
          width: strokeWidth,
          height: handleLen,
          backgroundColor: color,
          borderRadius: strokeWidth / 2,
          transform: [{ rotate: '-45deg' }],
        }}
      />
    </View>
  );
});
Search.displayName = 'Search';

/** Renderer default. Se usa cuando <UIProvider icons={...}> no pasa uno propio. */
export function renderDefaultIcon(name: IconName, props: IconRenderProps): React.ReactNode {
  switch (name) {
    case 'check':
      return <Check {...props} />;
    case 'close':
      return <Close {...props} />;
    case 'chevron-down':
      return <Chevron {...props} direction="down" />;
    case 'chevron-up':
      return <Chevron {...props} direction="up" />;
    case 'chevron-left':
      return <Chevron {...props} direction="left" />;
    case 'chevron-right':
      return <Chevron {...props} direction="right" />;
    case 'eye':
      return <Eye {...props} />;
    case 'eye-off':
      return <Eye {...props} off />;
    case 'search':
      return <Search {...props} />;
    case 'plus':
      return <PlusMinus {...props} />;
    case 'minus':
      return <PlusMinus {...props} minusOnly />;
    case 'alert':
      return <Circle {...props} filled label="!" />;
    case 'info':
      return <Circle {...props} label="i" />;
    case 'warning':
      return <Circle {...props} filled label="!" />;
    case 'question':
      return <Circle {...props} label="?" />;
    default:
      return null;
  }
}
