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
import { ThemeToggleDemo } from './ThemeToggle.demo';

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
  { slug: 'icon-button', name: 'IconButton', description: 'Botón de solo ícono, área táctil garantizada', Demo: IconButtonDemo },
  { slug: 'input', name: 'Input', description: 'Label, error, password toggle, loading', Demo: InputDemo },
  { slug: 'checkbox', name: 'Checkbox', description: 'Con label, animado, deshabilitable', Demo: CheckboxDemo },
  { slug: 'badge', name: 'Badge', description: 'Pill de estado: success/error/warning/info/neutral', Demo: BadgeDemo },
  { slug: 'card', name: 'Card', description: 'Contenedor con sombra y radius del theme', Demo: CardDemo },
  { slug: 'divider', name: 'Divider', description: 'Línea separadora de 1px', Demo: DividerDemo },
  { slug: 'avatar', name: 'Avatar', description: 'Círculo con ícono o iniciales', Demo: AvatarDemo },
  { slug: 'image', name: 'Image', description: 'Loading/error state, cache y priority="high" (prefetch)', Demo: ImageDemo },
  { slug: 'spinner', name: 'Spinner', description: 'Loading indicator con texto opcional', Demo: SpinnerDemo },
  { slug: 'skeleton', name: 'Skeleton', description: 'Placeholder que late y reserva el espacio del contenido', Demo: SkeletonDemo },
  { slug: 'empty-state', name: 'EmptyState', description: 'Ícono + título + descripción para listas vacías', Demo: EmptyStateDemo },
  { slug: 'key-value-row', name: 'KeyValueRow', description: 'Fila label/value, para totales y detalles', Demo: KeyValueRowDemo },
  { slug: 'fab', name: 'Fab', description: 'Botón flotante circular', Demo: FabDemo },
  { slug: 'pressable-scale', name: 'PressableScale', description: 'Feedback táctil genérico de "achicarse"', Demo: PressableScaleDemo },
];

export const MOLECULES: DemoEntry[] = [
  { slug: 'stepper', name: 'Stepper', description: '"-" + input numérico + "+"', Demo: StepperDemo },
  { slug: 'option-card', name: 'OptionCard', description: 'Card seleccionable, layout horizontal/vertical', Demo: OptionCardDemo },
  { slug: 'info-row', name: 'InfoRow', description: 'Ícono circular + label/valor apilado', Demo: InfoRowDemo },
  { slug: 'form-actions', name: 'FormActions', description: 'Par de botones primario/cerrar', Demo: FormActionsDemo },
  { slug: 'avatar-header', name: 'AvatarHeader', description: 'Header de detalle: círculo + título + subtítulo', Demo: AvatarHeaderDemo },
  { slug: 'theme-toggle', name: 'ThemeToggle', description: 'Segmented control Auto/Light/Dark', Demo: ThemeToggleDemo },
  { slug: 'steps', name: 'Steps', description: 'Indicador multi-paso: horizontal/vertical, check o número', Demo: StepsDemo },
];

export const ORGANISMS: DemoEntry[] = [
  { slug: 'modal', name: 'Modal', description: 'full / overlay / fullScreen / bottomSheet', Demo: ModalDemo },
  { slug: 'bottom-sheet', name: 'BottomSheet', description: 'Modal propio con arrastre para cerrar', Demo: BottomSheetDemo },
  { slug: 'select', name: 'Select', description: 'Dropdown con opciones flotantes', Demo: SelectDemo },
  { slug: 'alert', name: 'Alert', description: 'Diálogo + AlertProvider/useAlert imperativo', Demo: AlertDemo },
  { slug: 'screen', name: 'Screen', description: 'Contenedor raíz: safe area + teclado + scroll', Demo: ScreenDemo },
  { slug: 'list', name: 'List', description: 'Lista con loading/paginación/empty resueltos', Demo: ListDemo, hostsList: true },
  { slug: 'search-list', name: 'SearchList', description: 'Buscador + lista + paginación', Demo: SearchListDemo, hostsList: true },
  { slug: 'toast', name: 'Toast', description: 'Notificación efímera + ToastProvider/useToast imperativo', Demo: ToastDemo },
  { slug: 'date-picker', name: 'DatePicker', description: 'Calendario y DateField, sin picker nativo', Demo: DatePickerDemo },
  { slug: 'wizard', name: 'Wizard', description: 'Flujo multi-paso sobre Steps, con validación por paso', Demo: WizardDemo },
  {
    slug: 'navigation-bar',
    name: 'NavigationBar',
    description: 'Barra de pestañas con indicador animado, igual en iOS y Android',
    Demo: NavigationBarDemo,
  },
];
