/** Structurally identical to react-native-safe-area-context's EdgeInsets, without depending on the package. */
export interface EdgeInsets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export const zeroInsets: EdgeInsets = { top: 0, right: 0, bottom: 0, left: 0 };
