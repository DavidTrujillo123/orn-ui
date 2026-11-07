import type { ReactNode } from 'react';

/**
 * Included glyphs (drawn with RN primitives, zero dependencies): the ones
 * the library uses internally plus a basic set for apps.
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
  | 'scan'
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
 * Icon name accepted by `iconName`, `leftIconName`, etc. Autocompletes the
 * included ones and also accepts any string, for those who plug in their own
 * set with `<UIProvider icons={...}>` (e.g. `iconName="calendar"`). A name
 * the active renderer doesn't know draws nothing (and warns in development).
 */
export type IconName = BuiltInIconName | (string & {});

export interface IconRenderProps {
  size: number;
  color: string;
}

/** Injectable renderer: replaces the default glyphs with those of any icon set. */
export type IconRenderer = (name: IconName, props: IconRenderProps) => ReactNode;
