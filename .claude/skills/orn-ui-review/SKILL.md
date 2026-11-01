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

### Presupuesto de tiempo (obligatorio)

El usuario quiere avances rápidos. Reglas:

- **Reportar primero la revisión estática** (Paso 1) en cuanto esté lista; la
  verificación en simulador viene después y se suma al reporte.
- Ninguna herramienta bloquea más de ~2 min. Si un comando falla o cuelga
  (Maestro, build, Metro), **un solo reintento**; si vuelve a fallar, seguir
  con lo que hay, decir qué no se pudo verificar y proponer delegarlo a un
  agente en background. Nunca encadenar reintentos con timeouts largos.
- Mandar al usuario una línea de estado antes de cualquier paso lento
  (arrancar Metro, build, Maestro).
- Agrupar capturas en un solo comando, no uno por paso.

### Setup (una vez por sesión)

```sh
UDID=C655D194-9AA0-4A27-BC90-C8534AFD3DE0        # iPhone 17
xcrun simctl boot $UDID 2>/dev/null; open -a Simulator
xcrun simctl bootstatus $UDID -b >/dev/null

# ¿app instalada? ¿Debug (necesita Metro) o Release (trae main.jsbundle)?
APP=$(xcrun simctl get_app_container booted com.anonymous.orn-ui-example app) \
  && ls "$APP" | grep -q main.jsbundle && echo release || echo debug-o-no-instalada

# Debug: solo levantar Metro (background, run_in_background), NO recompilar:
cd /Users/david/work/projects/orn-ui/orn-ui/apps/example && pnpm exec expo start --port 8081 < /dev/null
# NO usar CI=1: desactiva el watch y los cambios no llegan a la app
# esperar con loop acotado: curl -s localhost:8081/status | grep -q running
# Solo si la app no está instalada: pnpm ios (build largo, avisar al usuario).
# Release sin Metro, igual que CI: pnpm e2e:ios:build
```

### Por componente (un solo comando)

```sh
S=<scratchpad>; SLUG=<slug>; LAYER=<atoms|molecules|organisms>
xcrun simctl launch booted com.anonymous.orn-ui-example >/dev/null
xcrun simctl openurl booted "ornui:///$LAYER/$SLUG?v=1"; /bin/sleep 4   # ?v=N abre la variante N (1-based)
xcrun simctl ui booted appearance light
xcrun simctl io booted screenshot $S/$SLUG-light.png
xcrun simctl ui booted appearance dark; /bin/sleep 2
xcrun simctl io booted screenshot $S/$SLUG-dark.png
xcrun simctl ui booted appearance light
xcrun simctl ui booted content_size accessibility-extra-extra-extra-large; /bin/sleep 2
xcrun simctl io booted screenshot $S/$SLUG-ax.png
xcrun simctl ui booted content_size large
```

`allowFontScaling` es opcional y `false` por defecto (decisión del usuario):
con el demo por defecto la captura `-ax` sale igual a `-light` y eso **no** es
hallazgo. La captura `-ax` sirve para el futuro controlador de tamaños; hasta
entonces, solo reportar si un componente ignora `allowFontScaling={true}`.

### Árbol de accesibilidad

```sh
timeout 90 maestro --udid $UDID hierarchy > $S/$SLUG-hier.json
```

Si da `IOSDriverTimeoutException` (driver XCUITest no arranca), no reintentar
en bucle. Causa conocida (2026-10-31): macOS 27.2 con Xcode 26.5 — AMFI bloquea
`DTServiceHub` (`/usr/bin/log show --last 5m | grep DTServiceHub` muestra
`disallowed without correct com.apple.private.amfi.version-restriction`). No
tiene arreglo desde Maestro: hace falta un Xcode compatible con macOS 27.x.
Mientras tanto, cubrir la a11y con tests de RTL (`getByRole('header')`,
`toHaveAccessibilityValue`, etc.) y marcar el árbol real como pendiente.

- Mirar **cada** captura con Read: alineación, recortes, contraste, espaciados,
  estados. Comparar light vs dark. Juzgar con las leyes de `DESIGN-LAWS.md`
  (proximidad, región común, figura/fondo, punto focal, área táctil).
- El demo usa un pager vertical (`VariantList`). Para ver la variante N sin
  swipe: `ornui:///<capa>/<slug>?v=N`. El parámetro solo se lee al montar:
  para cambiar de variante, `simctl terminate` + `launch` y abrir el link de nuevo.
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
- **Docs web** (`/Users/david/work/projects/orn-ui/orn-ui-docs`): sincronizar
  `demos/<Name>.demo.tsx` con el del example app (solo cambia el import de
  `VariantList`), capturar variantes con
  `scripts/capture-variants.sh <capa> <slug> <n> [y alto]` (ver `MEDIA.md`) y
  **si el componente tiene movimiento propio** (spinner, skeleton, shiny text,
  transition, cualquier animación que no requiere tocar) usar `VIDEO=1` para
  que cada variante y la portada sean `.mp4` (regla del usuario: con
  movimiento, la docs va en video). Estáticos: solo capturas y sin `.mp4`.
  Interactivos (requieren tocar): conservar el `.mp4` existente hasta
  regrabarlo con Maestro. Luego
  revisar la página en móvil 390, tablet 820 y PC 1440, claro y oscuro,
  emulando el dispositivo por CDP (Chrome headless no baja de ~500px de ancho
  con `--window-size`; da falsos desbordes). Componente estático: borrar su
  `.mp4`. Si `astro dev` sirve CSS viejo, `touch` al `.astro`.
  En local la docs lee orn-ui del **repo hermano** (`scripts/orn-ui-path.mjs`
  y `paths` en `tsconfig.demos.json`, que apunta a `lib/typescript`): correr
  `pnpm --filter orn-ui build` antes del build de la docs. Vercel usa npm, así
  que una API nueva rompe el deploy hasta publicar; `ORN_UI_PUBLISHED=1 pnpm
  run build` reproduce ese caso. Avisar al usuario qué APIs requieren publicar.

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
No hacer commits salvo que el usuario lo pida. Cuando lo pida: commit **directo en `main`** (no crear ramas salvo que lo pida), incluyendo los cambios de la skill y `PROGRESS.md`, y confirmar con `git log --oneline -1` en qué rama quedó.
