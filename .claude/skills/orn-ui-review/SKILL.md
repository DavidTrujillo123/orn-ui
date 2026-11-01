---
name: orn-ui-review
description: Mandatory workflow for ANY work in the orn-ui project (/Users/david/work/projects/orn-ui) — a pure React Native component library with zero runtime dependencies. Use it whenever the user asks to review, check, test, fix, polish or "revisar" a component, or to continue the component-by-component review ("siguiente componente", "continuar revisión"). Covers static review, visual and interaction verification on the iOS simulator (light and dark), fixes that respect the repo rules, and the persistent progress log in PROGRESS.md so the review survives closed conversations.
---

# orn-ui — revisión componente por componente

Objetivo: recorrer los 44 demos del catálogo (50 componentes exportados) y confirmar
que cada uno **se ve** bien y **interactúa** bien en un dispositivo real, corrigiendo
lo que no. El estado vive en `PROGRESS.md` (junto a este archivo), no en la
conversación.

## Rutas

| qué | ruta |
|---|---|
| raíz del workspace | `/Users/david/work/projects/orn-ui` |
| repo (monorepo pnpm, git) | `/Users/david/work/projects/orn-ui/orn-ui` |
| componentes | `orn-ui/packages/ui/src/{atoms,molecules,organisms}/<Name>.tsx` |
| tests | `orn-ui/packages/ui/src/<layer>/__tests__/<Name>.test.tsx` |
| theme | `orn-ui/packages/ui/src/theme/` (`createStyles`, `tokens.ts`, `palettes.ts`) |
| demos | `orn-ui/apps/example/demos/<Name>.demo.tsx` + `demos/manifest.ts` |
| Maestro | `orn-ui/apps/example/.maestro/` (leer `MAESTRO.md` antes de escribir flows) |
| progreso | `PROGRESS.md` en el directorio de esta skill |
| leyes y patrones de diseño | `DESIGN-LAWS.md` en el directorio de esta skill |

Otras carpetas (`orn-ui-docs`, `test-orm-ui`, `todo-orn-sdk5x`) son consumidores/docs:
no tocarlas salvo que el usuario lo pida.

## Paso 0 — siempre al empezar

1. Leer `PROGRESS.md`. Si el usuario no nombró un componente, tomar el primero en
   estado `pendiente` (o retomar el que esté `en-curso`).
2. Leer `orn-ui/AGENTS.md` si no está en contexto: sus reglas son ley
   (cero dependencias, Expo SDK 54-57 / RN 0.81 / React 19.1, tokens del theme,
   capas atómicas, Gestalt en el doc comment, accesibilidad).
3. Usar graft para contexto (`graft_file_api`, `graft_find_code`,
   `graft_trace_calls`) antes de grep/read masivos.
4. Leer `DESIGN-LAWS.md` (Gestalt, leyes de UX, principios de interacción,
   sistema visual del proyecto, patrones de componentes). Es el criterio de la
   revisión de diseño en los pasos 1 y 2.
5. Marcar el componente `en-curso` en `PROGRESS.md`.

## Paso 1 — revisión estática

Leer el componente, su demo, su test y su behavior flow (si existe en
`.maestro/flows/behavior/`). Revisar:

- **Props vs demo**: cada prop/variante pública aparece en el demo. Si falta una,
  no se puede verificar visualmente — anotarlo.
- **Theme**: cero literales de color/espaciado/radio/duración; todo vía
  `createStyles((theme) => ...)`. Funciona con `light` y `dark`.
- **Accesibilidad**: `accessibilityLabel` cuando no hay texto visible;
  `accessibilityRole`/`accessibilityState` en todo lo interactivo; touch target
  ≥ 44pt; el label no oculta el valor visible (bug conocido tipo DateField).
- **Interacción**: estados disabled/loading/error, callbacks controlados vs no
  controlados, `onPress` no se dispara deshabilitado, teclado, gestos que compiten
  con un ScrollView padre.
- **Animación**: `useNativeDriver: true` solo con opacity/transform; respeta
  reduce motion (`useReduceMotion`); limpia animaciones/timers al desmontar.
- **Layout**: textos largos, contenedor estrecho, RTL básico, sin `position`
  absoluto mal anclado.
- **Capas**: un atom no importa molecules/organisms; molecule no importa organisms.
- **Gestalt**: el doc comment nombra la ley y coincide con lo que hace.
- **Leyes de diseño y patrones**: pasar el checklist de la §6 de
  `DESIGN-LAWS.md` (Fitts, Hick, Jakob, Doherty, Von Restorff, escala de
  tokens, contraste AA, patrones de API). Citar la ley por nombre en cada
  hallazgo.

## Paso 2 — verificación visual e interacción en simulador

Jest corre en jsdom: no ve posiciones, gestos ni clipping. Este paso no se salta.

```sh
# simulador
xcrun simctl list devices | grep -E "Booted|iPhone"
xcrun simctl boot "iPhone 17" 2>/dev/null; open -a Simulator

# app (Debug + Metro, para iterar rápido)
cd /Users/david/work/projects/orn-ui/orn-ui && pnpm ios        # en background
# (Release sin Metro, igual que CI: cd apps/example && pnpm e2e:ios:build)

# abrir el demo directo por deep link
xcrun simctl openurl booted "ornui:///<atoms|molecules|organisms>/<slug>"

# capturas (guardarlas en el scratchpad de la sesión, luego leerlas con Read)
xcrun simctl io booted screenshot <scratchpad>/<slug>-light.png
xcrun simctl ui booted appearance dark
xcrun simctl io booted screenshot <scratchpad>/<slug>-dark.png
xcrun simctl ui booted appearance light

# árbol de accesibilidad real (lo que Maestro y VoiceOver ven)
maestro hierarchy
```

- Mirar **cada** captura con Read: alineación, recortes, contraste, espaciados,
  estados. Comparar light vs dark. Juzgar con las leyes de `DESIGN-LAWS.md`
  (proximidad, región común, figura/fondo, punto focal, área táctil).
- Probar también tamaño de fuente grande: `xcrun simctl ui booted
  content_size extra-extra-large` (volver con `large`).
- El demo usa un pager vertical (`VariantList`): avanzar variantes con el subflow
  `.maestro/subflows/` de swipe calibrado, no con swipes largos.
- Interacción: escribir un flow ad hoc en el scratchpad (`appId:
  com.anonymous.orn-ui-example`) con `tapOn`, `inputText`, `swipe`,
  `assertVisible`, `takeScreenshot` y correrlo con `maestro test <archivo>`.
  Fallos: leer `~/.maestro/tests/<timestamp>/commands-*.json` (`hierarchyRoot`),
  no adivinar.
- Problemas de build Debug tras un Release: ver sección correspondiente en
  `apps/example/.maestro/MAESTRO.md` (`.last_build_configuration`).
- Si el simulador no está disponible, decirlo explícitamente y marcar la
  verificación visual como pendiente — nunca declararla hecha.

## Paso 3 — reportar

Al usuario, por componente:

```
<Name> — <ok | N problemas>
- [visual|interacción|a11y|theme|api] <ley/patrón>: descripción — archivo:línea — evidencia (captura / hierarchy)
Propuesta: ...
```

Pedir confirmación antes de cambios que alteren la API pública o el aspecto por
defecto. Arreglos obvios (bug claro, a11y faltante) se pueden aplicar directo.

## Paso 4 — corregir

- Respetar reglas de `AGENTS.md`. Nada de dependencias nuevas.
- Añadir/ajustar test en `__tests__/<Name>.test.tsx` que falle sin el arreglo.
- Si el bug era visual/posicional/gesto: añadir o actualizar
  `.maestro/flows/behavior/<name>-<qué>.yaml`.
- Si cambian props/variantes: actualizar el demo; si cambia la API pública, la
  fila en `README.md`, `packages/ui/README.md`, `packages/ui/AGENTS.md`,
  `packages/ui/llms.txt`.
- Re-verificar en simulador (Paso 2) tras el arreglo.

Antes de decir "hecho" (desde `orn-ui/`):

```sh
pnpm --filter orn-ui test -- <Name>
pnpm harness
pnpm -r typecheck
# al cerrar un grupo de componentes o si se tocó theme/API:
pnpm --filter orn-ui test:coverage && pnpm compat
```

Reportar resultados reales; si algo falla, decirlo con la salida.

## Paso 5 — actualizar PROGRESS.md

Cambiar estado (`pendiente` → `en-curso` → `ok` | `arreglado` | `bloqueado`),
fecha absoluta (YYYY-MM-DD) y una línea de notas: qué se encontró, qué se
arregló, qué queda. Esto es lo que permite retomar en otra conversación.
No hacer commits salvo que el usuario lo pida.
