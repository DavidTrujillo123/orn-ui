import type { DemoEntry } from '../manifest';
import { InvoiceFormExample } from './InvoiceFormExample';
import { ClientListExample } from './ClientListExample';
import { CheckoutWizardExample } from './CheckoutWizardExample';

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
];
