import { StyleSheet } from 'react-native';
import { useTheme } from './UIProvider';
import type { Theme } from './types';

/**
 * createStyles(factory)
 * Devuelve un hook useStyles() que memoiza el StyleSheet resultante por
 * theme (WeakMap<Theme, Styles>), no por instancia de componente. Todas las
 * filas de una lista comparten el mismo objeto de estilos: sin esto, N filas
 * ⇒ N StyleSheet.create() por render, que es lo que hacía cada componente
 * de la app original con `useMemo(() => createStyles(colors), [colors])`.
 *
 * La cache vive en el closure del factory (una WeakMap por llamada a
 * createStyles, es decir, una por componente), así que temas de distintos
 * <UIProvider> en el mismo árbol no colisionan entre sí.
 *
 * El tipo de `factory` sigue el patrón oficial de RN para StyleSheet
 * tipados (`T extends StyleSheet.NamedStyles<T> | StyleSheet.NamedStyles<any>`):
 * es lo que le da contexto a TS para inferir literales ('row', 'center', ...)
 * en vez de ensancharlos a `string` dentro del objeto devuelto.
 */
export function createStyles<T extends StyleSheet.NamedStyles<T> | StyleSheet.NamedStyles<any>>(
  factory: (theme: Theme) => T | StyleSheet.NamedStyles<T>
): () => T {
  const cache = new WeakMap<Theme, T>();

  return function useStyles(): T {
    const theme = useTheme();
    let styles = cache.get(theme);
    if (!styles) {
      // El cast es seguro: StyleSheet.create<T>(...) con el mismo T del
      // factory siempre devuelve T; TS no puede probarlo por sí solo dentro
      // de un cuerpo genérico (T podría "instanciarse" con un subtipo no
      // relacionado desde su punto de vista, aunque en runtime es el mismo).
      styles = StyleSheet.create(factory(theme)) as T;
      cache.set(theme, styles);
    }
    return styles;
  };
}
