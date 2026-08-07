import { Platform, type ViewStyle } from 'react-native';

// Las escalas numéricas se tipan explícitamente como `number` (no `as const`):
// createTheme() debe poder sobreescribir cualquier valor con otro número
// arbitrario: con literal typing, un override de `radius.md` a `999` fallaría
// porque el tipo inferido sería el literal `8`, no `number`.

/**
 * Escala de espaciado. Usar siempre estos valores en vez de números mágicos
 * para que el ritmo vertical/horizontal sea consistente entre componentes.
 */
export const spacing: Record<'xxs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl' | 'xxxl', number> = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const radius: Record<'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl' | 'full', number> = {
  none: 0,
  xs: 4,
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 20,
  full: 9999,
};

export const fontSize: Record<'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl', number> = {
  xs: 11,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 24,
};

// fontWeight sí necesita literales: TextStyle.fontWeight de RN exige un union
// de strings específicos ('400' | '500' | ...), no `string` arbitrario.
export const fontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const;

export const lineHeight: Record<'sm' | 'md' | 'lg', number> = {
  sm: 16,
  md: 20,
  lg: 24,
};

/** Duraciones en ms para Animated.timing/spring. */
export const duration: Record<'fast' | 'base' | 'slow', number> = {
  fast: 150,
  base: 200,
  slow: 250,
};

type ShadowStyle = Pick<
  ViewStyle,
  'shadowColor' | 'shadowOffset' | 'shadowOpacity' | 'shadowRadius' | 'elevation'
>;

/**
 * Sombras cross-platform: shadow* para iOS, elevation para Android.
 * `shadowColor` se deja en negro fijo — el color de sombra por tema es un
 * detalle demasiado fino para justificar la complejidad de resolverlo aquí.
 */
export const shadow: Record<'none' | 'sm' | 'md' | 'lg', ShadowStyle> = {
  none: Platform.select({
    android: { elevation: 0 },
    default: { shadowOpacity: 0 },
  }) as ShadowStyle,
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
};

export const tokens = {
  spacing,
  radius,
  fontSize,
  fontWeight,
  lineHeight,
  duration,
  shadow,
};

export type Tokens = typeof tokens;
