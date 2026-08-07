import type { DemoEntry } from '../manifest';
import { InvoiceFormExample } from './InvoiceFormExample';
import { ClientListExample } from './ClientListExample';
import { CheckoutWizardExample } from './CheckoutWizardExample';
import { SignInExample } from './SignInExample';
import { SettingsScreenExample } from './SettingsScreenExample';
import { OrderTrackingExample } from './OrderTrackingExample';

/**
 * Ejemplos de integración: varios componentes trabajando juntos en un flujo
 * realista, a diferencia de las otras pestañas que aíslan un componente por vez.
 */
export const EXAMPLES: DemoEntry[] = [
  {
    slug: 'invoice-form',
    name: 'Invoice form',
    description: 'Modal bottom-sheet con AvatarHeader, Input, Stepper, Select, Checkbox, KeyValueRow y FormActions',
    Demo: InvoiceFormExample,
    // Flujo, no catálogo de variantes: scroll libre en vez del pager.
    freeScroll: true,
  },
  {
    slug: 'client-list',
    name: 'Client list',
    description: 'SearchList con búsqueda, paginación y borrado confirmado (Avatar, Badge, IconButton, useAlert)',
    Demo: ClientListExample,
    hostsList: true,
  },
  {
    slug: 'checkout-wizard',
    name: 'Checkout wizard',
    description: 'Wizard de 4 pasos con validación por paso, DateField, OptionCard y Toast al finalizar',
    Demo: CheckoutWizardExample,
    // El Wizard necesita flex:1 real para que el footer quede abajo.
    hostsList: true,
  },
  {
    slug: 'sign-in',
    name: 'Sign in',
    description: 'Login con validación en submit, password toggle, botón en loading y el camino de error (Input, Checkbox, useAlert, useToast)',
    Demo: SignInExample,
    freeScroll: true,
  },
  {
    slug: 'settings',
    name: 'Settings screen',
    description: 'Ajustes con ThemeToggle en vivo, Select, Checkbox, InfoRow, Badge, BottomSheet y borrado confirmado',
    Demo: SettingsScreenExample,
    freeScroll: true,
  },
  {
    slug: 'order-tracking',
    name: 'Order tracking',
    description: 'Estado que avanza solo: Steps vertical, Badge, Image con prefetch, Spinner de carga y EmptyState',
    Demo: OrderTrackingExample,
    freeScroll: true,
  },
];
