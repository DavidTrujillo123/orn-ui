import React, { memo } from 'react';
import { Text, View } from 'react-native';
import type { BuiltInIconName, IconName, IconRenderProps } from './types';

/**
 * Glifos default dibujados con primitivas de RN (View + border + transform).
 * Cero dependencias, cero fuentes, cero carga asíncrona. Cubren lo que la
 * librería necesita internamente (checkbox, chevrons de Select, toggle de
 * password en Input, etc) más un set básico para apps (menu, home, user…).
 * Para un set completo, el consumidor inyecta el suyo vía
 * <UIProvider icons={...}> o la prop `icon`.
 */

/**
 * Color del glifo interior de un ícono relleno (alert, warning): negro o
 * blanco según la luminancia del relleno. Un blanco fijo desaparecía sobre
 * los rellenos claros del modo oscuro (figura y fondo). Colores no-hex
 * (rgb(), nombres) caen en blanco, el caso común sobre acentos saturados.
 */
export function onColor(fill: string): string {
  const hex = fill.trim().replace('#', '');
  const full = hex.length === 3 ? hex.split('').map((c) => c + c).join('') : hex.slice(0, 6);
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return '#fff';
  const channel = (i: number) => {
    const c = parseInt(full.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  const r = channel(0);
  const g = channel(2);
  const b = channel(4);
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  // Umbral donde el contraste con negro supera al contraste con blanco.
  return luminance > 0.179 ? '#000' : '#fff';
}

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
              color: filled ? onColor(color) : color,
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

// ── Set básico para apps ────────────────────────────────────────────────
// Mismas reglas que el resto: solo View/Text, trazo proporcional al tamaño
// (`size / 10`, mínimo 1.5) y caja cuadrada de `size`, para que todos se
// alineen igual en una fila (Gestalt, similitud).

const stroke = (size: number) => Math.max(1.5, size / 10);
const box = (size: number) => ({ width: size, height: size, alignItems: 'center' as const, justifyContent: 'center' as const });

const Menu = memo(({ size, color }: IconRenderProps) => {
  const sw = stroke(size);
  const bar = { width: size * 0.7, height: sw, borderRadius: sw / 2, backgroundColor: color };
  return (
    <View style={[box(size), { gap: size * 0.16 }]}>
      <View style={bar} />
      <View style={bar} />
      <View style={bar} />
    </View>
  );
});
Menu.displayName = 'Menu';

const More = memo(({ size, color }: IconRenderProps) => {
  const d = Math.max(3, size * 0.16);
  const dot = { width: d, height: d, borderRadius: d / 2, backgroundColor: color };
  return (
    <View style={[box(size), { flexDirection: 'row', gap: size * 0.12 }]}>
      <View style={dot} />
      <View style={dot} />
      <View style={dot} />
    </View>
  );
});
More.displayName = 'More';

const Home = memo(({ size, color }: IconRenderProps) => {
  const sw = stroke(size);
  const roof = size * 0.5;
  return (
    <View style={box(size)}>
      {/* Techo: un cuadrado con dos bordes, girado 45°. */}
      <View
        style={{
          position: 'absolute',
          top: size * 0.14,
          width: roof,
          height: roof,
          borderTopWidth: sw,
          borderLeftWidth: sw,
          borderColor: color,
          transform: [{ rotate: '45deg' }],
        }}
      />
      {/* Cuerpo: paredes y piso. */}
      <View
        style={{
          position: 'absolute',
          bottom: size * 0.12,
          width: size * 0.56,
          height: size * 0.4,
          borderLeftWidth: sw,
          borderRightWidth: sw,
          borderBottomWidth: sw,
          borderColor: color,
        }}
      />
    </View>
  );
});
Home.displayName = 'Home';

const Settings = memo(({ size, color }: IconRenderProps) => {
  const sw = stroke(size);
  const ring = size * 0.5;
  const tooth = { width: size * 0.16, height: size * 0.2, backgroundColor: color, borderRadius: sw / 2 };
  return (
    <View style={box(size)}>
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
        <View key={deg} style={[box(size), { position: 'absolute', transform: [{ rotate: `${deg}deg` }] }]}>
          <View style={[tooth, { position: 'absolute', top: size * 0.08 }]} />
        </View>
      ))}
      <View style={{ width: ring, height: ring, borderRadius: ring / 2, borderWidth: sw * 1.6, borderColor: color }} />
    </View>
  );
});
Settings.displayName = 'Settings';

const User = memo(({ size, color }: IconRenderProps) => {
  const sw = stroke(size);
  const head = size * 0.38;
  return (
    <View style={box(size)}>
      <View
        style={{
          position: 'absolute',
          top: size * 0.08,
          width: head,
          height: head,
          borderRadius: head / 2,
          borderWidth: sw,
          borderColor: color,
        }}
      />
      {/* Hombros: media elipse abierta abajo. */}
      <View
        style={{
          position: 'absolute',
          bottom: size * 0.08,
          width: size * 0.74,
          height: size * 0.34,
          borderTopLeftRadius: size * 0.37,
          borderTopRightRadius: size * 0.37,
          borderTopWidth: sw,
          borderLeftWidth: sw,
          borderRightWidth: sw,
          borderColor: color,
        }}
      />
    </View>
  );
});
User.displayName = 'User';

const Trash = memo(({ size, color }: IconRenderProps) => {
  const sw = stroke(size);
  const bodyW = size * 0.52;
  const bodyH = size * 0.56;
  return (
    <View style={box(size)}>
      {/* Asa y tapa. */}
      <View
        style={{
          position: 'absolute',
          top: size * 0.08,
          width: size * 0.26,
          height: size * 0.12,
          borderTopWidth: sw,
          borderLeftWidth: sw,
          borderRightWidth: sw,
          borderColor: color,
        }}
      />
      <View
        style={{
          position: 'absolute',
          top: size * 0.19,
          width: size * 0.72,
          height: sw,
          borderRadius: sw / 2,
          backgroundColor: color,
        }}
      />
      {/* Cuerpo con dos ranuras. */}
      <View
        style={{
          position: 'absolute',
          bottom: size * 0.08,
          width: bodyW,
          height: bodyH,
          borderLeftWidth: sw,
          borderRightWidth: sw,
          borderBottomWidth: sw,
          borderBottomLeftRadius: sw * 1.5,
          borderBottomRightRadius: sw * 1.5,
          borderColor: color,
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          gap: bodyW * 0.22,
        }}
      >
        <View style={{ width: sw * 0.8, height: bodyH * 0.55, backgroundColor: color, borderRadius: sw / 2 }} />
        <View style={{ width: sw * 0.8, height: bodyH * 0.55, backgroundColor: color, borderRadius: sw / 2 }} />
      </View>
    </View>
  );
});
Trash.displayName = 'Trash';

const Edit = memo(({ size, color }: IconRenderProps) => {
  const sw = stroke(size);
  return (
    <View style={box(size)}>
      {/* Lápiz: cuerpo con contorno, girado 45°, con la punta hacia abajo-izquierda. */}
      <View style={{ alignItems: 'center', transform: [{ rotate: '45deg' }, { translateY: -size * 0.02 }] }}>
        <View
          style={{
            width: size * 0.3,
            height: size * 0.66,
            borderWidth: sw,
            borderColor: color,
            borderTopLeftRadius: sw,
            borderTopRightRadius: sw,
          }}
        />
        <View
          style={{
            width: 0,
            height: 0,
            borderLeftWidth: size * 0.15,
            borderRightWidth: size * 0.15,
            borderTopWidth: size * 0.22,
            borderLeftColor: 'transparent',
            borderRightColor: 'transparent',
            borderTopColor: color,
          }}
        />
      </View>
    </View>
  );
});
Edit.displayName = 'Edit';

const Share = memo(({ size, color }: IconRenderProps) => {
  const sw = stroke(size);
  const arm = size * 0.26;
  return (
    <View style={box(size)}>
      {/* Caja abierta arriba. */}
      <View
        style={{
          position: 'absolute',
          bottom: size * 0.08,
          width: size * 0.64,
          height: size * 0.42,
          borderLeftWidth: sw,
          borderRightWidth: sw,
          borderBottomWidth: sw,
          borderBottomLeftRadius: sw * 1.5,
          borderBottomRightRadius: sw * 1.5,
          borderColor: color,
        }}
      />
      {/* Flecha hacia arriba saliendo de la caja. */}
      <View
        style={{
          position: 'absolute',
          top: size * 0.1,
          width: sw,
          height: size * 0.56,
          backgroundColor: color,
          borderRadius: sw / 2,
        }}
      />
      <View
        style={{
          position: 'absolute',
          top: size * 0.12,
          width: arm,
          height: arm,
          borderTopWidth: sw,
          borderLeftWidth: sw,
          borderColor: color,
          transform: [{ rotate: '45deg' }],
        }}
      />
    </View>
  );
});
Share.displayName = 'Share';

const Heart = memo(({ size, color }: IconRenderProps) => {
  // Dos círculos sobre un cuadrado girado 45°: la forma clásica, rellena.
  const s = size * 0.46;
  const lobe = { position: 'absolute' as const, width: s, height: s, borderRadius: s / 2, backgroundColor: color };
  return (
    <View style={box(size)}>
      <View style={{ width: s, height: s, transform: [{ translateY: size * 0.05 }, { rotate: '45deg' }] }}>
        <View style={{ position: 'absolute', width: s, height: s, backgroundColor: color }} />
        <View style={[lobe, { left: -s / 2 }]} />
        <View style={[lobe, { top: -s / 2 }]} />
      </View>
    </View>
  );
});
Heart.displayName = 'Heart';

/**
 * Estrella: glifo tipográfico (★, U+2605) como los de Circle. Una estrella de
 * cinco puntas no se puede componer bien con rectángulos; el selector de
 * variación U+FE0E fuerza la versión de texto (monocroma, del color pedido)
 * en vez del emoji.
 */
const Star = memo(({ size, color }: IconRenderProps) => (
  <View style={box(size)}>
    <Text
      allowFontScaling={false}
      style={{ color, fontSize: size * 0.95, lineHeight: size, textAlign: 'center', includeFontPadding: false }}
    >
      {'\u2605\uFE0E'}
    </Text>
  </View>
));
Star.displayName = 'Star';

/**
 * Advertencia: triángulo relleno con "!" (no un círculo como `alert`), para
 * que advertencia y error no se confundan solo por color.
 */
const WarningTriangle = memo(({ size, color }: IconRenderProps) => {
  const half = size * 0.5;
  const height = size * 0.88;
  return (
    <View style={box(size)}>
      <View
        style={{
          width: 0,
          height: 0,
          borderLeftWidth: half,
          borderRightWidth: half,
          borderBottomWidth: height,
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
          borderBottomColor: color,
        }}
      />
      <Text
        allowFontScaling={false}
        style={{
          position: 'absolute',
          bottom: size * 0.06,
          color: onColor(color),
          fontSize: size * 0.58,
          lineHeight: size * 0.66,
          fontWeight: '700',
          textAlign: 'center',
          includeFontPadding: false,
        }}
      >
        !
      </Text>
    </View>
  );
});
WarningTriangle.displayName = 'WarningTriangle';

const warned = new Set<string>();

/** Todos los glifos incluidos, en orden de catálogo. */
export const BUILT_IN_ICON_NAMES: readonly BuiltInIconName[] = [
  'check', 'close', 'plus', 'minus', 'search', 'menu', 'more', 'home', 'settings', 'user',
  'trash', 'edit', 'share', 'heart', 'star', 'eye', 'eye-off',
  'chevron-left', 'chevron-right', 'chevron-up', 'chevron-down', 'alert', 'warning', 'info', 'question',
];

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
      return <WarningTriangle {...props} />;
    case 'question':
      return <Circle {...props} label="?" />;
    case 'menu':
      return <Menu {...props} />;
    case 'more':
      return <More {...props} />;
    case 'home':
      return <Home {...props} />;
    case 'settings':
      return <Settings {...props} />;
    case 'user':
      return <User {...props} />;
    case 'trash':
      return <Trash {...props} />;
    case 'edit':
      return <Edit {...props} />;
    case 'share':
      return <Share {...props} />;
    case 'heart':
      return <Heart {...props} />;
    case 'star':
      return <Star {...props} />;
    default:
      // Un nombre fuera del set incluido solo tiene sentido con un renderer
      // propio (<UIProvider icons>). Sin él no hay glifo: avisar una vez.
      if (typeof __DEV__ !== 'undefined' && __DEV__ && !warned.has(name)) {
        warned.add(name);
        console.warn(`orn-ui: no built-in icon named "${name}". Pass <UIProvider icons={...}> to render custom names.`);
      }
      return null;
  }
}
