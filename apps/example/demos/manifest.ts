import type { ComponentType } from 'react';

import { TextDemo } from './Text.demo';
import { ButtonDemo } from './Button.demo';
import { IconButtonDemo } from './IconButton.demo';
import { InputDemo } from './Input.demo';
import { CheckboxDemo } from './Checkbox.demo';
import { BadgeDemo } from './Badge.demo';
import { CardDemo } from './Card.demo';
import { DividerDemo } from './Divider.demo';
import { AvatarDemo } from './Avatar.demo';
import { ImageDemo } from './Image.demo';
import { SpinnerDemo } from './Spinner.demo';
import { SkeletonDemo } from './Skeleton.demo';
import { TransitionDemo } from './Transition.demo';
import { EmptyStateDemo } from './EmptyState.demo';
import { KeyValueRowDemo } from './KeyValueRow.demo';
import { FabDemo } from './Fab.demo';
import { PressableScaleDemo } from './PressableScale.demo';

import { StepperDemo } from './Stepper.demo';
import { StepsDemo } from './Steps.demo';
import { OptionCardDemo } from './OptionCard.demo';
import { InfoRowDemo } from './InfoRow.demo';
import { FormActionsDemo } from './FormActions.demo';
import { AvatarHeaderDemo } from './AvatarHeader.demo';
import { SegmentedControlDemo } from './SegmentedControl.demo';

import { ModalDemo } from './Modal.demo';
import { BottomSheetDemo } from './BottomSheet.demo';
import { SelectDemo } from './Select.demo';
import { AlertDemo } from './Alert.demo';
import { ScreenDemo } from './Screen.demo';
import { ListDemo } from './List.demo';
import { SearchListDemo } from './SearchList.demo';
import { ToastDemo } from './Toast.demo';
import { DatePickerDemo } from './DatePicker.demo';
import { WizardDemo } from './Wizard.demo';
import { ThemeToggleDemo } from './ThemeToggle.demo';
import { NavigationBarDemo } from './NavigationBar.demo';

export interface DemoEntry {
  slug: string;
  name: string;
  description: string;
  Demo: ComponentType;
  /**
   * El demo renderiza su propia FlatList (List/SearchList). Se muestra una
   * sola variante a pantalla completa en vez del pager: anidar una
   * VirtualizedList dentro de otro scroller vertical rompe la virtualización
   * y React Native lo advierte en runtime.
   */
  hostsList?: boolean;
  /**
   * El demo es un flujo libre, no un catálogo de variantes: la pantalla de
   * detalle le da un ScrollView normal en vez del pager con snap. Sin esto el
   * contenido queda encerrado en una página de alto fijo y no se puede bajar.
   */
  freeScroll?: boolean;
}

export const ATOMS: DemoEntry[] = [
  { slug: 'typography', name: 'Typography', description: 'Title, Subtitle, Body, Caption', Demo: TextDemo },
  { slug: 'button', name: 'Button', description: 'Primary, secondary, outline, ghost, link, destructive · sm/md/lg', Demo: ButtonDemo },
  { slug: 'icon-button', name: 'IconButton', description: 'Icon-only button with a guaranteed touch target', Demo: IconButtonDemo },
  { slug: 'input', name: 'Input', description: 'Label, error, password toggle, loading', Demo: InputDemo },
  { slug: 'checkbox', name: 'Checkbox', description: 'With label, animated, disableable', Demo: CheckboxDemo },
  { slug: 'badge', name: 'Badge', description: 'Status pill: success/error/warning/info/neutral', Demo: BadgeDemo },
  { slug: 'card', name: 'Card', description: 'Container with the theme shadow and radius', Demo: CardDemo },
  { slug: 'divider', name: 'Divider', description: '1px separator line', Demo: DividerDemo },
  { slug: 'avatar', name: 'Avatar', description: 'Circle with an icon or initials', Demo: AvatarDemo },
  { slug: 'image', name: 'Image', description: 'Loading/error state, cache and priority="high" (prefetch)', Demo: ImageDemo },
  { slug: 'spinner', name: 'Spinner', description: 'Loading indicator with optional text', Demo: SpinnerDemo },
  { slug: 'skeleton', name: 'Skeleton', description: 'Pulsing placeholder that reserves the content space', Demo: SkeletonDemo },
  {
    slug: 'transition',
    name: 'Transition',
    description: 'Animated enter and exit, opacity/transform only on the native thread',
    Demo: TransitionDemo,
  },
  { slug: 'empty-state', name: 'EmptyState', description: 'Icon + title + description for empty lists', Demo: EmptyStateDemo },
  { slug: 'key-value-row', name: 'KeyValueRow', description: 'Label/value row, for totals and details', Demo: KeyValueRowDemo },
  { slug: 'fab', name: 'Fab', description: 'Circular floating button', Demo: FabDemo },
  { slug: 'pressable-scale', name: 'PressableScale', description: 'Generic press-to-shrink touch feedback', Demo: PressableScaleDemo },
];

export const MOLECULES: DemoEntry[] = [
  { slug: 'stepper', name: 'Stepper', description: '"-" + numeric input + "+", with range and typing rules', Demo: StepperDemo },
  { slug: 'option-card', name: 'OptionCard', description: 'Selectable option (radio) with icon, description and horizontal/vertical layout', Demo: OptionCardDemo },
  { slug: 'info-row', name: 'InfoRow', description: 'Circular icon + stacked label/value', Demo: InfoRowDemo },
  { slug: 'form-actions', name: 'FormActions', description: 'Primary/close button pair', Demo: FormActionsDemo },
  { slug: 'avatar-header', name: 'AvatarHeader', description: 'Detail header: circle + title + subtitle', Demo: AvatarHeaderDemo },
  {
    slug: 'segmented-control',
    name: 'SegmentedControl',
    description: 'Pick one of a few options, all visible at once',
    Demo: SegmentedControlDemo,
  },
  { slug: 'steps', name: 'Steps', description: 'Multi-step indicator: horizontal/vertical, check or number', Demo: StepsDemo },
];

export const ORGANISMS: DemoEntry[] = [
  { slug: 'modal', name: 'Modal', description: 'full / overlay / fullScreen', Demo: ModalDemo },
  { slug: 'bottom-sheet', name: 'BottomSheet', description: 'Sheet from the bottom: drag to dismiss, optional header, footer and scroll', Demo: BottomSheetDemo },
  { slug: 'select', name: 'Select', description: 'Anchored dropdown: emoji/icon per option, search, and it escapes any clipping parent', Demo: SelectDemo },
  { slug: 'alert', name: 'Alert', description: 'Dialog + imperative AlertProvider/useAlert', Demo: AlertDemo },
  { slug: 'screen', name: 'Screen', description: 'Root container: safe area + keyboard + scroll', Demo: ScreenDemo },
  { slug: 'list', name: 'List', description: 'List with loading/pagination/empty solved', Demo: ListDemo, hostsList: true },
  { slug: 'search-list', name: 'SearchList', description: 'Search box + list + pagination', Demo: SearchListDemo, hostsList: true },
  { slug: 'toast', name: 'Toast', description: 'Ephemeral notification + imperative ToastProvider/useToast', Demo: ToastDemo },
  { slug: 'date-picker', name: 'DatePicker', description: 'Calendar and DateField, no native picker', Demo: DatePickerDemo },
  { slug: 'wizard', name: 'Wizard', description: 'Multi-step flow over Steps, with per-step validation', Demo: WizardDemo },
  {
    slug: 'theme-toggle',
    name: 'ThemeToggle',
    description: 'SegmentedControl wired to UIProvider: Auto/Light/Dark',
    Demo: ThemeToggleDemo,
  },
  {
    slug: 'navigation-bar',
    name: 'NavigationBar',
    description: 'Tab bar with an animated indicator, identical on iOS and Android',
    Demo: NavigationBarDemo,
  },
];
