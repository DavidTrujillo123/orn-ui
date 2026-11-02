import { StyleSheet } from 'react-native';
import { useTheme } from './UIProvider';
import type { Theme } from './types';

/**
 * createStyles(factory)
 * Returns a useStyles() hook that memoizes the resulting StyleSheet per
 * theme (WeakMap<Theme, Styles>), not per component instance. All rows of a
 * list share the same styles object: without this, N rows ⇒ N
 * StyleSheet.create() per render, which is what every component of the
 * original app did with `useMemo(() => createStyles(colors), [colors])`.
 *
 * The cache lives in the factory's closure (one WeakMap per createStyles
 * call, i.e. one per component), so themes from different <UIProvider>s in
 * the same tree don't collide with each other.
 *
 * The `factory` type follows RN's official pattern for typed StyleSheets
 * (`T extends StyleSheet.NamedStyles<T> | StyleSheet.NamedStyles<any>`):
 * it is what gives TS the context to infer literals ('row', 'center', ...)
 * instead of widening them to `string` inside the returned object.
 */
export function createStyles<T extends StyleSheet.NamedStyles<T> | StyleSheet.NamedStyles<any>>(
  factory: (theme: Theme) => T | StyleSheet.NamedStyles<T>
): () => T {
  const cache = new WeakMap<Theme, T>();

  return function useStyles(): T {
    const theme = useTheme();
    let styles = cache.get(theme);
    if (!styles) {
      // The cast is safe: StyleSheet.create<T>(...) with the factory's same T
      // always returns T; TS can't prove it on its own inside a generic body
      // (T could be "instantiated" with an unrelated subtype from its point
      // of view, even though at runtime it is the same).
      styles = StyleSheet.create(factory(theme)) as T;
      cache.set(theme, styles);
    }
    return styles;
  };
}
