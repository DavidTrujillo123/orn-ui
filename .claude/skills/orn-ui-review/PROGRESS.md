# Progreso de revisión orn-ui

Estados: pendiente | en-curso | ok | arreglado | bloqueado. Fechas absolutas (YYYY-MM-DD).
Deep link: `ornui:///<capa>/<slug>`. Orden sugerido: atoms → molecules → organisms.

## atoms

| componente | slug | estado | fecha | notas |
|---|---|---|---|---|
| Typography (Title/Subtitle/Body/Caption) | typography | en-curso | 2026-10-31 | Title arreglado: accessibilityRole header (sobreescribible), doc comment Gestalt (punto focal/Prägnanz), tokens nuevos letterSpacing.tight y lineHeight.xl, demo multilínea, 5 tests nuevos. Tests 679 ok, harness y typecheck ok. Pendiente: captura de la variante multilínea y árbol a11y real (Maestro roto); revisar Subtitle/Body/Caption |
| Button | button | pendiente | | |
| IconButton | icon-button | pendiente | | |
| Input | input | pendiente | | |
| Checkbox | checkbox | pendiente | | |
| Badge | badge | pendiente | | |
| Card | card | pendiente | | |
| Divider | divider | pendiente | | |
| Gradient | gradient | pendiente | | |
| Avatar | avatar | pendiente | | |
| Image | image | pendiente | | |
| Spinner | spinner | pendiente | | |
| Skeleton | skeleton | pendiente | | |
| Transition | transition | pendiente | | |
| ShinyText | shiny-text | pendiente | | |
| EmptyState | empty-state | pendiente | | |
| KeyValueRow | key-value-row | pendiente | | |
| Fab | fab | pendiente | | |
| PressableScale | pressable-scale | pendiente | | |

## molecules

| componente | slug | estado | fecha | notas |
|---|---|---|---|---|
| Stepper | stepper | pendiente | | |
| OptionCard | option-card | pendiente | | |
| InfoRow | info-row | pendiente | | |
| FormActions | form-actions | pendiente | | |
| AvatarHeader | avatar-header | pendiente | | |
| SegmentedControl | segmented-control | pendiente | | |
| Steps | steps | pendiente | | |
| SymmetricGrid | symmetric-grid | pendiente | | |

## organisms

| componente | slug | estado | fecha | notas |
|---|---|---|---|---|
| Modal | modal | pendiente | | |
| BottomSheet | bottom-sheet | pendiente | | |
| Select | select | pendiente | | |
| OptionWheel | option-wheel | pendiente | | |
| Timeline | timeline | pendiente | | |
| Alert (+AlertProvider) | alert | pendiente | | |
| Screen | screen | pendiente | | |
| List | list | pendiente | | |
| SearchList | search-list | pendiente | | |
| Toast (+ToastProvider) | toast | pendiente | | |
| DatePicker (+DateField) | date-picker | pendiente | | |
| Wizard | wizard | pendiente | | |
| ThemeToggle | theme-toggle | pendiente | | |
| NavigationBar | navigation-bar | pendiente | | |
| Slides | slides | pendiente | | |
| Chart | chart | pendiente | | |
| ReorderableList | reorderable-list | pendiente | | |

## Decisiones y trabajo futuro

- 2026-10-31 — `allowFontScaling`: se queda **opcional y en `false` por defecto** (decisión del usuario). Captura `-ax` idéntica a `-light` NO es hallazgo mientras siga así.
- Futuro: "controlador de tamaños" para el escalado de fuente (tope tipo `maxFontSizeMultiplier` controlado desde `UIProvider`) para poder activar `allowFontScaling` sin romper layouts. Al hacerlo, revisar todos los componentes con fuente grande.

