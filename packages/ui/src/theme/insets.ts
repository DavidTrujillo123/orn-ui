/** Estructuralmente igual a EdgeInsets de react-native-safe-area-context, sin depender del paquete. */
export interface EdgeInsets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export const zeroInsets: EdgeInsets = { top: 0, right: 0, bottom: 0, left: 0 };
