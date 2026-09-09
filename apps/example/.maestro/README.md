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
  demos/                    # clips para la doc — NO son tests, ver abajo
    _beat.yaml               # pausa de MS ms (Maestro no tiene sleep)
    <categoría>-<slug>.yaml  # generados: recorrido de variantes
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
pnpm e2e:ios:smoke                      # ~47 flows generados, rápido
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

- `ci.yml` (Ubuntu, en cada push a un tag): `gen:maestro:check` y `pnpm harness`
  — baratos, detectan manifest desincronizado y componentes sin flow, sin
  simulador.
- `e2e-ios.yml` (macOS, `workflow_dispatch`): corre el suite completo contra un
  simulador real, con las screenshots subidas como artifact. No bloquea merges
  ni el publish — es señal, no gate.

## Clips para la documentación (`demos/`)

`demos/` no es parte del suite: `config.yaml` incluye sólo `flows/**/*.yaml`,
así que `maestro test .maestro` —o sea `e2e:ios` y CI— nunca los corre. Es a
propósito: un clip que se rompe no debe poner en rojo los tests, y no aporta
cobertura (lo que el componente hace ya lo afirma su flow de behavior).

Lo que sí aportan es que la coreografía del demo que se ve en la doc sea
código versionado al lado del componente, en vez de una grabación de pantalla
hecha a mano que envejece en silencio.

```sh
pnpm --filter example gen:maestro:demos        # regenera .maestro/demos/
pnpm --filter example gen:maestro:demos:check  # falla si están desactualizados

# desde el repo de la doc (hermano de éste):
scripts/record-demo.sh bottom-sheet   # uno
scripts/record-all-demos.sh           # todos
```

Los flows de `demos/` se generan igual que los de humo, pero con otra cosa
adentro: `gen-maestro-demos.mjs` lee el manifest **y el `.tsx` del demo** —
la cantidad de variantes no está en el manifest, vive en el array que el demo
le pasa a `VariantList`— y emite un swipe de página más un beat por variante.
Así el clip muestra las N variantes y no sólo la primera.

Lo que el generador no sabe hacer es interacción: abrir la hoja, cancelar el
form, elegir una opción. Esos van a mano y se listan en `HAND_WRITTEN` dentro
del generador, que los saltea al regenerar.

El parseo de los manifests lo comparten los dos generadores
(`scripts/manifest-parse.mjs`); tener dos copias era garantía de que se
desincronicen.

Ese script corre el flow acá, se queda con el mp4 que deja `startRecording` y
lo encodea a `public/media/<slug>.mp4`. Detalles del encode y por qué video en
vez de GIF: `MEDIA.md` en el repo de la doc.

Diferencia de estilo con un flow de test: acá el ritmo importa. Entre acciones
va `runFlow: _beat.yaml` con `MS`, porque Maestro no tiene comando de pausa
(`sleep` y `wait` son sintaxis inválida, y `waitForAnimationToEnd` vuelve
apenas la pantalla queda quieta) y sin ese beat el clip es un parpadeo. Y se
muestra un solo camino —el gesto característico del componente—, no toda su
superficie.
