# Progreso de revisión orn-ui

Estados: pendiente | en-curso | ok | arreglado | bloqueado. Fechas absolutas (YYYY-MM-DD).
Deep link: `ornui:///<capa>/<slug>`. Orden sugerido: atoms → molecules → organisms.

## atoms

| componente | slug | estado | fecha | notas |
|---|---|---|---|---|
| Typography (Title/Subtitle/Body/Caption) | typography | arreglado | 2026-10-31 | Title arreglado y verificado (multilínea ok). Subtitle arreglado: lineHeight.lg, doc comment Gestalt, demo multilínea, test; captura ok. Peso subido a semibold 600 (decisión usuario). Body arreglado: doc comment Gestalt; demo usaba #00cae1 (≈1.9:1, falla AA) ahora colors.primary; pager ?v=N último índice arreglado (clamp). Body se queda en 14px (decisión usuario). Caption arreglado: lineHeight.sm, doc comment Gestalt, demo multilínea, test; contraste AA ok (5.7:1 light, 6.4:1 dark). Typography completo salvo árbol a11y real (Maestro roto) |
| Button | button | arreglado | 2026-10-31 | Arreglado: hitSlop sm/link (Fitts), loading sin cambio de ancho, ícono custom con separación, Reduce Motion, sin #000 literal, doc Gestalt; 685 tests ok. Disabled sin opacidad extra y padding md 16 / lg 20 (decisión usuario). Variante "Loading (static)" para capturas |
| IconButton | icon-button | arreglado | 2026-10-31 | hitSlop hasta 44pt (el comentario decía 44 garantizado pero eran 40, y 32 con size 16), doc Gestalt figura/fondo, demo color theme (error). PressableScale ahora respeta Reduce Motion (afecta IconButton). Docs: catálogo + 7 capturas, sin mp4. Íconos: +10 (menu, more, home, settings, user, trash, edit, share, heart, star), IconName abierto a string, BUILT_IN_ICON_NAMES, warning ahora triángulo, glifo interior de alert/warning con contraste (onColor) |
| Input | input | arreglado | 2026-10-31 | crash con label="" (!!label), "required" y error anunciados a lectores, textos del ojo/clear en labels (i18n) + rightIconAccessibilityLabel, botón derecho 44pt, read-only sin relleno (affordance), duración desde token, doc Gestalt. Docs: 6 capturas; el mp4 queda (interactivo) pero está desactualizado: regrabar con Maestro |
| Checkbox | checkbox | arreglado | 2026-10-31 | Arreglado: crash label="", prop accessibilityLabel, label atenuado en disabled, check con onColor en color propio, Reduce Motion, tokens (duración, margen md), doc Gestalt, demo color theme. Fila minHeight 44 (Fitts, decisión usuario: opción A, reemplaza marginBottom). Docs: 4 capturas, mp4 queda (interactivo, regrabar) |
| Badge | badge | arreglado | 2026-10-31 | padding a tokens (md/xs, antes 10/5), letterSpacing.wide (token nuevo), una línea con …, doc Gestalt similitud + no solo color, demo custom con colores del theme (VIP morado fallaba AA en dark). Docs: 7 capturas, sin mp4 |
| Card | card | arreglado | 2026-10-31 | en dark era invisible (sombra no se ve, surface≈fondo): borde hairline solo en dark; style acepta StyleProp (arrays); doc Gestalt región común; demo alineado y con colores del theme. Docs: 3 capturas, sin mp4 |
| Divider | divider | arreglado | 2026-10-31 | props nuevas orientation (vertical) y spacing (token), oculto a lectores (decorativo), doc Gestalt, demo con vertical y color del theme. Docs: 3 capturas (con vertical), sin mp4 |
| Gradient | gradient | arreglado | 2026-10-31 | diagonal en caja no cuadrada dejaba esquinas sin pintar (plano ahora mide la diagonal real con onLayout); líneas finas entre bandas (capas acumuladas hasta el final del plano); doc Gestalt figura/fondo; demo con texto blanco sobre celeste (fallaba contraste) ahora azul oscuro; steps por defecto 24→48 (bandas visibles en cajas anchas). Docs: 5 capturas, sin mp4 |
| Avatar | avatar | arreglado | 2026-10-31 | API nueva: source (foto, cae a iniciales si falla), name (iniciales + nombre accesible, initialsOf exportado), iconName (default user), color; overflow hidden; role image con nombre, decorativo sin él; doc Gestalt; demo con theme y tamaños centrados. Docs: 6 capturas, sin mp4 |
| Image | image | arreglado | 2026-10-31 | BUG: el fallback nunca se veía (RN dispara onLoadEnd también al fallar y pisaba el error) → éxito con onLoad; fallback default con ícono warning y centrado (también el propio); accessibilityLabel (role image, decorativo sin él); fadeDuration de token; doc Gestalt cierre; fondo gris solo mientras carga/falla (se veía detrás de PNG transparentes). Docs: 5 capturas, sin mp4 |
| Spinner | spinner | arreglado | 2026-10-31 | ring rompía con colores no-hex (color+"33") → riel con opacity; a11y progressbar ocupado con nombre (text ?? labels.loading) + accessibilityLabel; crash text=""; ritmos de loop como constantes nombradas; doc Gestalt destino común; demo con colores del theme y fila de tamaños alineada. prop logo (imagen sobre el indicador, splash) pedida por el usuario. Docs: clip por variante (claro/oscuro) + portada mp4 (tiene movimiento) |
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
- Futuro (después de revisar todos los componentes): compatibilidad web (PC/tablet) con react-native-web. Hallazgo ya visto: Title con role header sale como `<div>` sin `role=heading`/nivel en web; propuesta prop `level` (h1…h6). Chromium headless disponible en `~/Library/Caches/ms-playwright/chromium-1234` para capturas.
- 2026-10-31 — Pendiente publicar orn-ui 0.2.11 (íconos nuevos, BUILT_IN_ICON_NAMES, IconName abierto). La docs ya lee el repo local (lista copiada de IconButton reemplazada por el import); falta publicar y subir la dependencia de `orn-ui-docs` a ^0.2.11 antes de desplegarla (Vercel usa npm).
- 2026-10-31 — Visto en el ejemplo Sign in: `Button variant="link"` queda alineado a la izquierda aunque el texto de arriba esté centrado (fuerza `justifyContent: flex-start`). Revisar con Button o con el ejemplo.
