# E2E con Maestro

Pruebas reales en simulador de iOS, no sólo tipos ni render en jsdom. Existen
porque dos bugs seguidos (BottomSheet mandado arriba de la pantalla, drag de
ReorderableList roto en iOS) pasaron los 462 tests de jest sin problema: el
texto estaba visible, sólo que en el lugar equivocado, o el gesto se lo comía
un scroll padre. Ningún test de render atrapa esa clase de bug — hace falta
correr la app de verdad y afirmar *posición* y *comportamiento*, no sólo
presencia.

## Estructura

```
.maestro/
  config.yaml              # flowsDir
  subflows/
    open-demo.yaml          # deep link -> assert título, sin swipe
    smoke-demo.yaml          # lo mismo + un swipe genérico del pager
  flows/
    smoke/                  # generados, uno por demo del manifest
      nav-tabs-and-list.yaml   # el único que navega a mano (tabs/lista/back)
    behavior/                # escritos a mano, sólo donde hay interacción real
```

Cada demo es alcanzable por deep link (`ornui:///organisms/bottom-sheet`),
sin navegar tabs ni scrollear listas — así el suite entero no depende de que
la navegación funcione para poder probar un componente aislado. Ese único
camino de navegación real vive en `nav-tabs-and-list.yaml`.

## Generar los flows de humo

```sh
pnpm --filter example gen:maestro         # regenera .maestro/flows/smoke/
pnpm --filter example gen:maestro:check   # falla si están desactualizados (CI)
```

El generador (`scripts/gen-maestro-flows.mjs`) lee `demos/manifest.ts` y
`demos/examples/manifest.ts` — agregar un componente al catálogo alcanza para
sumarlo al suite, no hay que escribir su flow de humo a mano.

## Correr

Necesita macOS + Xcode + un simulador de iOS booteado (o `maestro
start-device --platform ios`).

```sh
cd apps/example
pnpm exec expo prebuild -p ios          # una vez, o si cambió la config nativa
pnpm e2e:ios:build                      # build Release, sin dev bundler
pnpm e2e:ios:smoke                      # ~45 flows generados, rápido
pnpm e2e:ios:behavior                   # flows de comportamiento a mano
pnpm e2e:ios                            # todo
```

## Escribir un flow de `behavior/`

Sólo para interacción que un smoke genérico no cubre: arrastrar, tocar un
backdrop, cambiar de tema, paginar un wizard. Cada uno debería documentar en
un comentario **qué bug de regresión previene**, no sólo qué hace — ver
`bottom-sheet-position-and-dismiss.yaml` y `reorderable-list-drag.yaml` como
plantilla: los dos existen porque replican, paso a paso, el bug real que ya
pasó una vez.

Preferí selectores relativos (`below:`, `above:`) contra un ancla estable
(texto que vive fuera del componente bajo prueba, como la descripción del
demo) en vez de sólo `assertVisible`. Un `assertVisible` no ve *dónde* está
algo — un selector relativo sí, y es la única forma barata de blindar contra
un bug de layout sin comparar screenshots.

## CI

- `ci.yml` (Ubuntu, en cada push a un tag): sólo `gen:maestro:check` — barato,
  detecta manifest desincronizado sin simulador.
- `e2e-ios.yml` (macOS, nightly + manual): corre el suite completo contra un
  simulador real. No bloquea merges ni el publish — es señal, no gate.
