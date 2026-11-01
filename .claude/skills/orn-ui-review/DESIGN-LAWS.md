# Leyes y patrones de diseño para orn-ui

Referencia obligatoria en el Paso 1 (revisión estática) y en el Paso 2 (captura
en simulador). Cada hallazgo de diseño se reporta citando la ley por su nombre,
p. ej. `[visual] Proximidad: label a 12px del input y 8px del siguiente campo —
se lee agrupado con el campo de abajo`.

Los doc comments de los componentes ya citan leyes ("Gestalt, destino común:",
"Gestalt, figura y fondo:"). La revisión comprueba que **la ley citada coincide
con lo que se ve en la captura**. Si no hay ley citada, proponer cuál aplica.

---

## 1. Leyes de Gestalt (percepción y agrupación)

| ley | qué dice | cómo se verifica en orn-ui | componentes donde más pesa |
|---|---|---|---|
| **Proximidad** | Lo que está cerca se percibe como un grupo. | Espacio *dentro* del grupo < espacio *entre* grupos (regla práctica: interno ≤ ½ externo). Label↔control con `spacing.xs/sm`, entre campos `spacing.lg+`. | Input, KeyValueRow, InfoRow, FormActions, AvatarHeader, List, Card |
| **Similitud** | Lo que se parece (color, forma, tamaño) se percibe relacionado. | Variantes del mismo nivel comparten forma; lo que difiere en función difiere visualmente. Un solo primario por pantalla. | Button (variants), Badge (status), SegmentedControl, OptionCard, Steps |
| **Región común** | Elementos dentro de un mismo borde/fondo forman un grupo. | Card/Sheet/Modal encierran solo lo relacionado; nada "flota" medio dentro. | Card, BottomSheet, Modal, Alert, Select (dropdown), OptionCard |
| **Figura y fondo** | El ojo separa figura de fondo por contraste/profundidad. | Overlay/backdrop con opacidad suficiente; sombra/elevación coherente; selección visible en light **y** dark. | Modal, BottomSheet, Toast, Fab, Select, SegmentedControl |
| **Destino común** | Lo que se mueve junto se percibe como unidad. | Elementos que pertenecen juntos animan con la misma curva/duración/dirección; los que no, no se arrastran. | ReorderableList, Transition, ShinyText, Slides, Toast, Chart |
| **Continuidad** | El ojo sigue líneas y curvas suaves. | Conectores alineados sin quiebres; ejes alineados; scroll horizontal insinúa continuidad (peek). | Timeline, Steps, Slides, Chart, NavigationBar |
| **Cierre** | La mente completa formas incompletas. | Skeleton sugiere la forma final real; íconos legibles a tamaño mínimo; un item cortado al borde indica "hay más". | Skeleton, Image (placeholder), Slides, Icon |
| **Conexión uniforme** | Elementos unidos por una línea/forma están más relacionados que por proximidad. | Las líneas conectoras unen solo pasos/eventos del mismo flujo. | Steps, Timeline, Wizard |
| **Simetría y orden (Prägnanz)** | Se prefiere la interpretación más simple y estable. | Grillas regulares; última fila centrada, no desalineada; nada que parezca error de alineación. | SymmetricGrid, Avatar, EmptyState, Chart |
| **Punto focal / Von Restorff** | Lo distinto se recuerda y se mira primero. | Exactamente un elemento rompe la serie (CTA, item activo, error). Si todo destaca, nada destaca. | Button primary, Fab, Badge, NavigationBar (tab activa), Input (error) |

## 2. Leyes de UX (interacción)

| ley | regla para orn-ui | dónde verificar |
|---|---|---|
| **Fitts** | Área táctil ≥ **44×44 pt** (iOS) / **48×48 dp** (Android), por tamaño o `hitSlop`. Acciones frecuentes cerca del pulgar (abajo); destructivas lejos de las primarias. | IconButton, Checkbox, Stepper (+/−), Fab, NavigationBar, FormActions, cierre de Modal/Sheet |
| **Hick-Hyman** | Más opciones = decisión más lenta. SegmentedControl ≤ 5 opciones; más de ~7 → Select/OptionWheel con búsqueda. | SegmentedControl, Select, OptionWheel, SearchList, OptionCard |
| **Miller (7±2) / chunking** | Agrupar información en bloques; flujos largos se dividen en pasos. | Wizard, Steps, DatePicker (mes en semanas), KeyValueRow |
| **Jakob** | Los usuarios esperan que funcione como el resto de apps: patrones nativos de iOS/Android (swipe-down cierra sheet, back cierra modal, wheel tipo iOS). | BottomSheet, Modal (`onRequestClose` Android), OptionWheel, NavigationBar, Alert |
| **Tesler (complejidad conservada)** | La complejidad la absorbe el componente, no el consumidor: defaults sensatos, pocas props obligatorias. | API de todos; List (carga/refresh/paginación/vacío resueltos) |
| **Doherty (< 400 ms)** | Feedback inmediato: press feedback ≤ 100 ms, animaciones `duration.fast/base/slow` (150/200/250 ms); estados loading cuando hay espera. | Button (loading), PressableScale, Input (loading), Spinner, Skeleton, Image |
| **Postel (robustez)** | Aceptar entradas flexibles, emitir salidas estrictas. | Stepper (`sanitizeNumeric`), Input, DateField, SearchList |
| **Gradiente de objetivo** | Mostrar progreso motiva a completar. | Steps, Wizard, Slides (dots) |
| **Zeigarnik** | Lo incompleto se recuerda: indicar pasos pendientes y estado de cada uno. | Steps, Wizard |
| **Posición serial** | Primer y último elemento se recuerdan más: acción principal al final o al inicio, no en el medio. | FormActions, NavigationBar, Alert (botones) |
| **Pico-final** | La experiencia se juzga por el punto más intenso y el final: confirmaciones y cierres claros. | Toast (éxito), Alert, Wizard (paso final) |
| **Estética-usabilidad** | Lo que se ve pulido se percibe más usable — pero no tapa errores de interacción. | Todo; no aprobar un componente solo porque "se ve bien" |

## 3. Principios de interacción (Norman / Nielsen)

- **Affordance y signifiers**: lo tocable parece tocable (forma de botón, chevron en Select/DateField, handle en BottomSheet/ReorderableList).
- **Feedback**: todo toque responde (pressed state, scale, ripple); todo cambio de estado es visible y anunciado (`accessibilityState`, `accessibilityLiveRegion`/announce en Toast).
- **Mapeo natural**: + a la derecha, − a la izquierda; swipe en la dirección del movimiento del contenido.
- **Restricciones / prevención de errores**: disabled real (no solo visual), min/max en Stepper, fechas fuera de rango deshabilitadas, confirmación en destructivas (`showConfirm`).
- **Consistencia**: misma prop = mismo comportamiento en todos (`disabled`, `loading`, `size`, `variant`, `testID`, `accessibilityLabel`).
- **Visibilidad del estado**: seleccionado, enfocado, error, cargando, vacío — cada uno con su apariencia propia.
- **Recuperación de errores**: mensaje de error junto al campo (Proximidad), en lenguaje claro, color + texto/ícono (no solo color).
- **Divulgación progresiva**: mostrar lo esencial; el resto en Sheet/Modal/Select.

## 4. Sistema visual del proyecto

- **Espaciado (base 4)**: solo `spacing` → `xxs 2 · xs 4 · sm 8 · md 12 · lg 16 · xl 20 · xxl 24 · xxxl 32`. Un número fuera de la escala es hallazgo.
- **Radios**: `radius` (`xs 4 … xxl 20, full`). Radio anidado: interno = externo − padding (un hijo no tiene radio mayor que su contenedor).
- **Tipografía / jerarquía**: `fontSize xs 11 … xxl 24`, `lineHeight sm 16 / md 20 / lg 24`, pesos `400/500/600/700`. Máx. ~3 niveles de jerarquía visibles por componente. Respeta escala de fuente del sistema (Dynamic Type): probar `allowFontScaling` y textos largos sin recortes.
- **Color y contraste (WCAG AA)**: texto normal ≥ **4.5:1**, texto grande/íconos/bordes de controles ≥ **3:1**, en light y dark. Nunca transmitir estado solo con color.
- **Movimiento**: solo `opacity`/`transform` con `useNativeDriver: true`; duraciones del token `duration`; entradas ease-out, salidas ease-in (o spring); respetar Reduce Motion (`useReduceMotion`) — sin animación o fundido simple.
- **Elevación**: `shadow none/sm/md/lg` coherente con la profundidad (Toast/Modal > Card > fila).
- **Safe area y teclado**: nada bajo notch/home indicator; inputs visibles con teclado abierto (Screen, BottomSheet, Modal).
- **Densidad**: altura mínima de filas/controles interactivos 44 pt; separación mínima entre objetivos táctiles 8 pt.

## 5. Patrones de diseño de componentes (código)

Usar estos patrones al revisar o corregir la API. Si un componente se desvía, anotarlo.

| patrón | cuándo | ejemplo en orn-ui |
|---|---|---|
| **Controlado + no controlado** | Cualquier valor editable: `value`/`onChange` + `defaultValue`. Nunca a medias. | Input, Checkbox, SegmentedControl, Select, Stepper, DatePicker |
| **Composición sobre configuración** | Slots (`header`, `footer`, `left`, `right`, `children`) en vez de N props booleanas. | Card, BottomSheet, Modal, Screen, List |
| **Provider + hook + puente imperativo** | Servicios globales: `<XProvider>` + `useX()` en componentes + `showX()` fuera de React. | AlertProvider, ToastProvider (`imperativeBridge.ts`), UIProvider/theme |
| **Hook headless (lógica separada de vista)** | Estado/gestos complejos testeables sin UI. | `useSlides`, `useReduceMotion`, `buildMonthGrid` |
| **Tokens + `createStyles`** | Todo estilo derivado del theme; estilos memoizados por theme. | Todos |
| **Variantes por mapa** | `variant`/`size` resueltos con un objeto de estilos, no `if` encadenados. | Button, Badge, Text |
| **Primitivas compuestas** (cero deps) | Si la plataforma no trae algo, componerlo con RN core. | Gradient (bandas), ReorderableList (PanResponder), Chart |
| **Portal / escape de clipping** | Overlays que deben salir de un padre con `overflow: hidden`. | Select, Modal, Toast |
| **Forward de props nativas** | Pasar `testID`, `style`, `accessibility*` y props del primitivo base (`...rest`). | Button, Input, Image |
| **Polimorfismo limitado** | `as`/`render` solo si aporta; preferir componentes con nombre (Title/Subtitle/Body/Caption). | Text |

Antipatrones a reportar: prop drilling profundo en vez de contexto; estado derivado duplicado en `useState`; `useEffect` para sincronizar props controladas; estilos inline creados en cada render; listeners/timers sin cleanup; `key={index}` en listas reordenables; booleanos excluyentes (`primary`, `secondary`) en vez de `variant`.

## 6. Checklist rápido por componente

1. ¿Qué ley de Gestalt rige su layout? ¿El doc comment la nombra y la captura la confirma?
2. ¿Área táctil ≥ 44 pt y separación ≥ 8 pt? (Fitts)
3. ¿Un solo punto focal? (Von Restorff)
4. ¿Espaciados y radios dentro de la escala de tokens? ¿Interno < externo? (Proximidad)
5. ¿Contraste AA en light y dark? ¿Estado no solo por color?
6. ¿Feedback inmediato al toque y estados loading/disabled/error/vacío? (Doherty, Norman)
7. ¿Se comporta como espera el usuario de iOS/Android? (Jakob)
8. ¿Animación de lo que va junto sincronizada, y Reduce Motion respetado? (Destino común)
9. ¿API controlada/no controlada, slots y defaults sensatos? (Tesler, patrones §5)
10. ¿Textos largos / fuente grande sin romper el layout?
