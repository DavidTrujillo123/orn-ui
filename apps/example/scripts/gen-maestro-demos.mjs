#!/usr/bin/env node
// Genera un flow de "clip para la doc" por cada demo del manifest, en
// .maestro/demos/. No son tests: config.yaml sólo incluye flows/**, así que
// `maestro test .maestro` nunca los corre. Ver .maestro/README.md.
//
// Lo que genera es un recorrido de variantes: entra por deep link, arranca la
// grabación ya en la pantalla del demo y pagina por las N variantes dejando un
// beat en cada una para que se lean. La cantidad de variantes sale de leer el
// `.tsx` del demo — el manifest no la sabe.
//
// La interacción (abrir un modal, elegir una opción, escribir en un campo) no
// se puede derivar del manifest: va declarada por componente y variante en la
// tabla INTERACTIONS de más abajo, con selectores tomados de flows/behavior/.
// Un flow escrito a mano en HAND_WRITTEN no se toca.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseAllManifests, variantLabels } from './manifest-parse.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DEMOS_DIR = path.join(ROOT, '.maestro/demos');
const APP_ID = 'com.anonymous.orn-ui-example';

// Flows escritos a mano: tienen interacción real (abren la hoja, cancelan un
// form, cierran por backdrop) y el generador no sabe hacer eso. No se
// sobrescriben ni se cuentan como sobrantes.
const HAND_WRITTEN = new Set(['organisms-bottom-sheet.yaml']);
// Subflows del propio directorio, no son clips.
const SUBFLOWS = new Set(['_beat.yaml']);

// Variantes que entran al clip, por componente. El default es "todas", que
// para un catálogo de estilos (Button, Badge) es exactamente lo que hay que
// ver. Pero hay componentes donde la variante no cambia lo que se ve en
// reposo —- nueve Select cerrados son nueve campos idénticos— y el recorrido
// completo es medio minuto de nada. Ahí se elige a mano lo que se muestra: la
// que se abre, la que se comporta distinto, la que tiene otro estado.
//
// Las variantes que no están igual se atraviesan (el pager no puede saltar),
// pero sin beat: se pasa de largo.
const CLIP_VARIANTS = {
  'organisms/select': [0, 4, 7],
  'organisms/date-picker': [0, 1, 6],
  // Spinner y Skeleton animan para siempre, y Maestro espera a que la
  // pantalla se aquiete después de cada comando: cada variante de más son
  // varios segundos de clip esperando a nada. El de Spinner llegó a durar 84
  // segundos con las 7. Se muestran las que cambian la forma del indicador
  // —lo que el resto varía (tamaño, color, nodo propio) se lee en la tabla de
  // props, no hace falta verlo girar.
  'atoms/spinner': [0, 1, 2],
  'atoms/skeleton': [0, 1, 4],
};

// `waitForAnimationToEnd` sin timeout espera a que la pantalla se quede
// quieta, y hay componentes que por definición no se quedan quietos nunca:
// Spinner gira siempre, Skeleton late, Slides avanza solo. Ahí se comía el
// timeout por defecto en cada variante — el clip de Spinner salió de 142
// segundos, casi todo esperando. Con tope explícito la espera sirve para lo
// que se necesita (que termine la transición de página) y no bloquea al resto.
const WAIT = `- waitForAnimationToEnd:
    timeout: 1200`;

// Beat después de cada variante. Corto: son pantallas estáticas y el clip
// entero tiene que seguir siendo un loop mirable — Button tiene 11 variantes.
const BEAT_MS = 900;
// El primero es más largo: es el frame que queda de poster y el que el
// visitante ve mientras el video arranca.
const FIRST_BEAT_MS = 1200;

// Interacción por componente y variante (índice 0-based del array del demo).
// Es lo que el recorrido de variantes no puede inventar: abrir el modal,
// elegir una opción, escribir en el campo. Sin esto, media docena de clips
// serían una pantalla con un botón sin apretar.
//
// Los selectores no son nuevos: salen de flows/behavior/, donde ya están
// probados contra esta app. Un número en la lista es un beat en ms; el resto
// va tal cual al YAML.
//
// No hace falta cubrir cada variante: la que no está acá se muestra quieta,
// que para una variante que sólo cambia estilo es exactamente lo que hay que
// mostrar.
const INTERACTIONS = {
  'atoms/checkbox': {
    0: ['- tapOn: "Accept terms"', 900, '- tapOn: "Accept terms"', 600],
  },
  'atoms/input': {
    0: ['- tapOn: "you@example.com"', '- inputText: "hello@orn-ui.dev"', 1100, '- hideKeyboard'],
    1: ['- tapOn: "Show password"', 900, '- tapOn: "Hide password"', 600],
  },
  'atoms/transition': {
    // El título del botón alterna Show/Hide y el contenido arranca visible.
    0: ['- tapOn: "Hide"', 900, '- tapOn: "Show"', 900],
  },
  'molecules/stepper': {
    0: ['- tapOn: "Increment"', 500, '- tapOn: "Increment"', 700, '- tapOn: "Decrement"', 500],
  },
  'molecules/segmented-control': {
    0: ['- tapOn: "Day"', 800, '- tapOn: "Month"', 800, '- tapOn: "Week"', 500],
  },
  'molecules/steps': {
    7: ['- tapOn: "Advance"', 800, '- tapOn: "Advance"', 800],
  },
  'organisms/modal': {
    0: ['- tapOn: "Open full"', WAIT, 1400, '- tapOn: "Close"', WAIT],
    // El backdrop cubre la pantalla entera: su centro cae debajo de la card,
    // así que se cierra por un punto explícito abajo (igual que el test).
    1: ['- tapOn: "Open overlay"', WAIT, 1400, '- tapOn:\n    point: "50%,90%"', WAIT],
    2: ['- tapOn: "Open fullScreen"', WAIT, 1400, '- tapOn: "Close"', WAIT],
  },
  'organisms/select': {
    // index: 1 — el label y el valor del campo comparten texto; el 0 es el label.
    0: ['- tapOn:\n    text: "Payment method"\n    index: 1', WAIT, 1000, '- tapOn: "Cash"', WAIT],
  },
  'organisms/alert': {
    0: ['- tapOn: "Show success"', WAIT, 1300, '- tapOn:\n    point: "50%,55%"', WAIT],
    // El diálogo de confirmación no se cierra por texto: con
    // accessibilityViewIsModal el Alert entero colapsa en UN nodo que ocupa la
    // pantalla —- su label es "?, Delete invoice?, This cannot be undone.,
    // Cancel, Delete" (verificado con `maestro hierarchy`)— así que no existe
    // un nodo "Cancel" al que apuntar, ni por texto ni por regex. El toque por
    // punto sí llega: la fusión es de accesibilidad, no de hit testing.
    // Tampoco sirve tocar el backdrop acá: esta variante pasa onConfirm y
    // onCancel, no onClose, así que tocar afuera no cierra nada.
    3: ['- tapOn: ".*Delete invoice.*"', WAIT, 1400, '- tapOn:\n    point: "31%,58%"', WAIT],
  },
  'organisms/toast': {
    0: ['- tapOn: "Success"', WAIT, 1500, '- tapOn: "Dismiss"', WAIT],
    2: ['- tapOn: "Fire three at once"', WAIT, 1600, '- tapOn: "Dismiss all"', WAIT],
  },
  'organisms/theme-toggle': {
    0: ['- tapOn: "Dark"', WAIT, 1300, '- tapOn: "Light"', WAIT, 800],
  },
  'organisms/navigation-bar': {
    0: ['- tapOn: "Search"', 900, '- tapOn: "Alerts"', 900, '- tapOn: "Home"', 600],
  },
  'organisms/wizard': {
    // "Next", no "Continue": el label de flows/behavior/ es el de la variante
    // de validación, que pasa labels propios. Ésta usa los del componente.
    0: ['- tapOn: "Next"', 1000, '- tapOn: "Next"', 1000],
  },
  'organisms/list': {
    0: ['- tapOn: "Empty"', 1000, '- tapOn: "First load"', 1000, '- tapOn: "Loaded"', 800],
  },
  'organisms/search-list': {
    0: ['- tapOn: "Search..."', '- inputText: "ban"', 1300, '- tapOn: "Clear"', '- hideKeyboard', 700],
  },
  'organisms/reorderable-list': {
    0: ['- swipe:\n    from:\n      text: "Design review"\n    direction: DOWN\n    duration: 600', WAIT, 1000],
  },
  'organisms/date-picker': {
    6: ['- tapOn: "Due date"', WAIT, 1500, '- tapOn:\n    point: "50%,8%"', WAIT],
  },
  'organisms/slides': {
    1: ['- tapOn:\n    id: "slides-numbers-indicator-2"', 1000, '- tapOn:\n    id: "slides-numbers-indicator-0"', 800],
    2: ['- tapOn:\n    id: "slides-vertical-indicator-2"', 1000, '- tapOn:\n    id: "slides-vertical-indicator-0"', 800],
  },
};

function yamlEscape(text) {
  return text.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function beat(ms) {
  return `- runFlow:
    file: _beat.yaml
    env: { MAESTRO_APP_ID: ${APP_ID}, MS: "${ms}" }`;
}

// Paginar es el subflow que ya existe para los tests, no un swipe propio: ahí
// están calibradas las coordenadas que avanzan exactamente una página. Un
// swipe más largo acumula velocidad y con `pagingEnabled` saltea variantes
// (ver el comentario de subflows/next-variant.yaml), que en un clip significa
// una variante que nunca se ve.
const PAGE_SWIPE = `- runFlow:
    file: ../subflows/next-variant.yaml
    env: { MAESTRO_APP_ID: ${APP_ID} }`;

function flowFor(entry, labels) {
  const manifestFile = entry.basePath === 'examples' ? 'demos/examples/manifest.ts' : 'demos/manifest.ts';
  const steps = [];

  const interactions = INTERACTIONS[`${entry.basePath}/${entry.slug}`] ?? {};
  const render = (commands) => commands.map((c) => (typeof c === 'number' ? beat(c) : c));

  const shown = CLIP_VARIANTS[`${entry.basePath}/${entry.slug}`];
  const isShown = (i) => !shown || shown.includes(i);
  const lastShown = labels ? labels.reduce((last, _, i) => (isShown(i) ? i : last), 0) : 0;

  if (entry.paged && labels && labels.length > 1) {
    let first = true;
    labels.forEach((label, i) => {
      // Una vez pasada la última variante elegida no hace falta seguir
      // paginando: el clip termina ahí.
      if (i > lastShown) return;
      if (i > 0) {
        steps.push(PAGE_SWIPE);
        steps.push(WAIT);
      }
      if (!isShown(i)) return;
      steps.push(`# ${i + 1}/${labels.length} — ${label}`);
      steps.push(beat(first ? FIRST_BEAT_MS : BEAT_MS));
      first = false;
      if (interactions[i]) steps.push(...render(interactions[i]));
    });
  } else if (interactions[0]) {
    // Sin pager pero con interacción propia (List, SearchList, Reorderable):
    // el clip es la interacción, no un scroll por contenido que ya se ve.
    steps.push(beat(FIRST_BEAT_MS));
    steps.push(...render(interactions[0]));
  } else {
    // Sin pager: el demo hostea su propia lista (hostsList) o es una pantalla
    // de flujo libre (freeScroll, los ejemplos). Ahí el clip muestra el
    // contenido scrolleando, que es todo lo que hay para mostrar sin
    // interacción específica.
    steps.push(beat(FIRST_BEAT_MS));
    for (let i = 0; i < 2; i++) {
      steps.push(`- swipe:
    start: "50%,75%"
    end: "50%,35%"
    duration: 600`);
      steps.push(WAIT);
      steps.push(beat(BEAT_MS));
    }
  }

  const variantNote = labels ? `${labels.length} variante${labels.length === 1 ? '' : 's'}` : 'sin catálogo de variantes';

  return `# Generado por scripts/gen-maestro-demos.mjs — no editar a mano.
# Fuente: ${manifestFile} (slug: ${entry.slug}) — ${variantNote}
#
# Clip para la doc, no un test. Ver .maestro/README.md.
appId: ${APP_ID}
---
- launchApp:
    clearState: true
- openLink: "ornui:///${entry.basePath}/${entry.slug}"
- assertVisible:
    text: "${yamlEscape(entry.name)}"
    index: 0
${WAIT}

- startRecording: ${entry.slug}

${steps.join('\n')}

- stopRecording
`;
}

function main() {
  const checkOnly = process.argv.includes('--check');
  const entries = parseAllManifests(ROOT);

  fs.mkdirSync(DEMOS_DIR, { recursive: true });
  const wanted = new Map();
  for (const entry of entries) {
    // Los ejemplos (SignIn, CheckoutWizard, …) no tienen página en la doc: son
    // pantallas de muestra del catálogo, no componentes documentados. Grabar
    // su clip era medio minuto de simulador por archivo que nadie sirve. El
    // suite de humo sí los cubre — eso no cambia.
    if (entry.basePath === 'examples') continue;
    const filename = `${entry.basePath}-${entry.slug}.yaml`;
    if (HAND_WRITTEN.has(filename)) continue;
    wanted.set(filename, flowFor(entry, variantLabels(ROOT, entry)));
  }

  const existing = fs.readdirSync(DEMOS_DIR).filter((f) => f.endsWith('.yaml'));
  const stale = existing.filter((f) => !wanted.has(f) && !HAND_WRITTEN.has(f) && !SUBFLOWS.has(f));

  let changed = false;
  for (const [filename, content] of wanted) {
    const filePath = path.join(DEMOS_DIR, filename);
    const current = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : null;
    if (current === content) continue;
    changed = true;
    if (checkOnly) console.error(`✗ desactualizado: .maestro/demos/${filename}`);
    else fs.writeFileSync(filePath, content);
  }
  for (const filename of stale) {
    changed = true;
    if (checkOnly) console.error(`✗ sobrante: .maestro/demos/${filename}`);
    else fs.unlinkSync(path.join(DEMOS_DIR, filename));
  }

  if (checkOnly) {
    if (changed) {
      console.error('\nLos flows de clip no están al día. Corré: pnpm --filter example gen:maestro:demos');
      process.exit(1);
    }
    console.log(`✓ ${wanted.size} flows de clip al día (+${HAND_WRITTEN.size} a mano)`);
    return;
  }
  console.log(`✓ Generados ${wanted.size} flows de clip en .maestro/demos/ (+${HAND_WRITTEN.size} a mano)`);
}

main();
