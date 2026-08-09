/**
 * Puente entre el proveedor montado y el código que no es un componente
 * (servicios, capa de API, interceptores). El proveedor se registra al montar y
 * se borra al desmontar, así que fuera del árbol nunca queda una referencia
 * viva a un contexto muerto.
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
          `orn-ui: se llamó a la API imperativa sin un <${providerName}> montado. La llamada se ignoró.`
        );
      }
      return current;
    },
  };
}
