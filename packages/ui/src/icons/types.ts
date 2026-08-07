import type { ReactNode } from 'react';

/** Glifos que los componentes de la librería necesitan internamente. */
export type IconName =
  | 'check'
  | 'close'
  | 'chevron-down'
  | 'chevron-up'
  | 'chevron-left'
  | 'chevron-right'
  | 'eye'
  | 'eye-off'
  | 'search'
  | 'plus'
  | 'minus'
  | 'alert'
  | 'info'
  | 'warning'
  | 'question';

export interface IconRenderProps {
  size: number;
  color: string;
}

/** Renderer inyectable: reemplaza los glifos default por los de cualquier set de iconos. */
export type IconRenderer = (name: IconName, props: IconRenderProps) => ReactNode;
