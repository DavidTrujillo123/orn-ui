import type { DemoEntry } from '../manifest';
import { InvoiceFormExample } from './InvoiceFormExample';
import { ClientListExample } from './ClientListExample';
import { CheckoutWizardExample } from './CheckoutWizardExample';
import { SignInExample } from './SignInExample';
import { SettingsScreenExample } from './SettingsScreenExample';
import { OrderTrackingExample } from './OrderTrackingExample';
import { BrandThemeExample } from './BrandThemeExample';

/**
 * Integration examples: several components working together in a realistic
 * flow, unlike the other tabs, which isolate one component at a time.
 */
export const EXAMPLES: DemoEntry[] = [
  {
    slug: 'brand-theme',
    name: 'Brand color',
    description: 'One hex repaints the whole app: createTheme({ brand }) derives the four accent roles in light and dark',
    Demo: BrandThemeExample,
    freeScroll: true,
  },
  {
    slug: 'invoice-form',
    name: 'Invoice form',
    description: 'Bottom-sheet modal with AvatarHeader, Input, Stepper, Select, Checkbox, KeyValueRow and FormActions',
    Demo: InvoiceFormExample,
    // A flow, not a catalog of variants: free scroll instead of the pager.
    freeScroll: true,
  },
  {
    slug: 'client-list',
    name: 'Client list',
    description: 'SearchList with search, pagination and confirmed deletion (Avatar, Badge, IconButton, useAlert)',
    Demo: ClientListExample,
    hostsList: true,
  },
  {
    slug: 'checkout-wizard',
    name: 'Checkout wizard',
    description: '4-step wizard with per-step validation, DateField, OptionCard and a Toast on finish',
    Demo: CheckoutWizardExample,
    // The Wizard needs a real flex:1 so the footer stays at the bottom.
    hostsList: true,
  },
  {
    slug: 'sign-in',
    name: 'Sign in',
    description: 'Login with validation on submit, password toggle, loading button and the error path (Input, Checkbox, useAlert, useToast)',
    Demo: SignInExample,
    freeScroll: true,
  },
  {
    slug: 'settings',
    name: 'Settings screen',
    description: 'Settings with a live ThemeToggle, Select, Checkbox, InfoRow, Badge, BottomSheet and confirmed deletion',
    Demo: SettingsScreenExample,
    freeScroll: true,
  },
  {
    slug: 'order-tracking',
    name: 'Order tracking',
    description: 'State that advances on its own: vertical Steps, Badge, Image with prefetch, loading Spinner and EmptyState',
    Demo: OrderTrackingExample,
    freeScroll: true,
  },
];
