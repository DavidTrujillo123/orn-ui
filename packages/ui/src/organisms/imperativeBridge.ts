/**
 * Bridge between the mounted provider and code that isn't a component
 * (services, API layer, interceptors). The provider registers itself on mount
 * and clears itself on unmount, so outside the tree there is never a live
 * reference left to a dead context.
 */
export interface ImperativeBridge<T> {
  set: (value: T | null) => void;
  get: () => T | null;
}

export function createImperativeBridge<T>(providerName: string): ImperativeBridge<T> {
  let current: T | null = null;

  return {
    set: (value) => {
      current = value;
    },
    get: () => {
      if (!current && __DEV__) {
        console.warn(
          `orn-ui: the imperative API was called without a mounted <${providerName}>. The call was ignored.`
        );
      }
      return current;
    },
  };
}
