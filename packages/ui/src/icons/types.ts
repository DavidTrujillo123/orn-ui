import type { ReactNode } from 'react';

/**
 * Glifos incluidos (dibujados con primitivas de RN, cero dependencias): los
 * que la librería usa por dentro más un set básico para apps.
 */
export type BuiltInIconName =
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
  | 'question'
  | 'menu'
  | 'more'
  | 'home'
  | 'settings'
  | 'user'
  | 'trash'
  | 'edit'
  | 'share'
  | 'heart'
  | 'star';

/**
 * Nombre de ícono aceptado por `iconName`, `leftIconName`, etc. Autocompleta
 * los incluidos y además acepta cualquier string, para quien conecta su propio
 * set con `<UIProvider icons={...}>` (p. ej. `iconName="calendar"`). Un nombre
 * que el renderer activo no conoce no dibuja nada (y avisa en desarrollo).
 */
export type IconName = BuiltInIconName | (string & {});

export interface IconRenderProps {
  size: number;
  color: string;
}

/** Renderer inyectable: reemplaza los glifos default por los de cualquier set de iconos. */
export type IconRenderer = (name: IconName, props: IconRenderProps) => ReactNode;
