#!/usr/bin/env node
// Generates a "docs clip" flow for each demo in the manifest, in
// .maestro/demos/. They're not tests: config.yaml only includes flows/**, so
// `maestro test .maestro` never runs them. See .maestro/README.md.
//
// What it generates is a walk through the variants: it enters via deep link,
// starts recording already on the demo's screen and pages through the N
// variants, leaving a beat on each so they can be read. The number of
// variants comes from reading the demo's `.tsx` — the manifest doesn't know it.
//
// Interaction (opening a modal, picking an option, typing in a field) can't
// be derived from the manifest: it's declared per component and variant in
// the INTERACTIONS table further down, with selectors taken from flows/behavior/.
// A hand-written flow in HAND_WRITTEN is left untouched.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseAllManifests, variantLabels } from './manifest-parse.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DEMOS_DIR = path.join(ROOT, '.maestro/demos');
const APP_ID = 'com.anonymous.orn-ui-example';

// Hand-written flows: they have real interaction (they open the sheet, cancel
// a form, close via backdrop) and the generator doesn't know how to do that.
// They aren't overwritten or counted as leftovers.
const HAND_WRITTEN = new Set(['organisms-bottom-sheet.yaml']);
// Subflows in this same directory, they're not clips.
const SUBFLOWS = new Set(['_beat.yaml']);

// Variants that go into the clip, per component. The default is "all", which
// for a catalog of styles (Button, Badge) is exactly what you need to see.
// But there are components where the variant doesn't change what's seen at
// rest —- nine closed Selects are nine identical fields— and the full walk is
// half a minute of nothing. There, what's shown is picked by hand: the one
// that opens, the one that behaves differently, the one with another state.
//
// The variants that aren't listed are still passed through (the pager can't
// skip), but without a beat: they're gone right past.
const CLIP_VARIANTS = {
  'organisms/select': [0, 4, 7],
  // Typing, the password toggle and the error state: the rest (clearable,
  // loading, read-only, validation, keyboard) are static frames the
  // Variants section already shows, and walking all eight took 40 seconds.
  'atoms/input': [0, 1, 3],
  'organisms/date-picker': [0, 1, 6],
  // Spinner and Skeleton animate forever, and Maestro waits for the screen to
  // settle after each command: each extra variant is several seconds of clip
  // waiting for nothing. Spinner's got to be 84 seconds long with all 7. The
  // ones that change the indicator's shape are shown —what the rest vary
  // (size, color, custom node) can be read in the props table, no need to
  // watch it spin.
  'atoms/spinner': [0, 1, 2],
  'atoms/skeleton': [0, 1, 4],
  // The six mark types, which is what someone comes to see: vertical bar
  // with its interaction, horizontal bar, line, area, donut and radar. Stacked
  // vs grouped, or pie vs donut, differ by one prop and that can be read in
  // the table — with all fourteen the clip was 34 seconds and 2 MB.
  //
  // The demo has them in exactly the first six positions on purpose: the
  // pager can't skip, so every variant that has to be passed through to reach
  // the last picked one is a swipe and a wait that get recorded anyway.
  //
  // The live variant stays out even though it's the flashiest: its
  // `setInterval` never lets the screen settle, so every following
  // `waitForAnimationToEnd` eats its whole timeout.
  'organisms/chart': [0, 1, 2, 3, 4, 5],
  // Timeline takes up the whole screen and its halo is pure gradient: with all
  // ten variants the clip was 29 seconds and 2 MB. What remains is the default
  // shape, the tap that makes the line travel, and the two that change the
  // path (straight, and starting on the left).
  //
  // The one that advances on its own stays out for the same reason as Chart's
  // live variant: its interval never lets the screen settle.
  'organisms/timeline': [0, 1, 5, 6],
};

// `waitForAnimationToEnd` without a timeout waits for the screen to go still,
// and some components by definition never go still: Spinner always spins,
// Skeleton pulses, Slides advances on its own. There it ate the default
// timeout on every variant — Spinner's clip came out at 142 seconds, almost
// all of it waiting. With an explicit cap the wait does what it's needed for
// (letting the page transition finish) and doesn't block the rest.
const WAIT = `- waitForAnimationToEnd:
    timeout: 1200`;

// Beat after each variant. Short: they're static screens and the whole clip
// has to stay a watchable loop — Button has 11 variants.
const BEAT_MS = 900;
// The first one is longer: it's the frame left as the poster and the one the
// visitor sees while the video starts.
const FIRST_BEAT_MS = 1200;

// Interaction per component and variant (0-based index in the demo's array).
// It's what the walk through variants can't make up: opening the modal,
// picking an option, typing in the field. Without this, half a dozen clips
// would be a screen with an unpressed button.
//
// The selectors aren't new: they come from flows/behavior/, where they're
// already tested against this app. A number in the list is a beat in ms; the
// rest goes into the YAML as is.
//
// There's no need to cover every variant: one that isn't here is shown
// still, which for a variant that only changes style is exactly what has to
// be shown.
const INTERACTIONS = {
  'atoms/checkbox': {
    0: ['- tapOn: "Accept terms"', 900, '- tapOn: "Accept terms"', 600],
  },
  'atoms/input': {
    0: ['- tapOn: "you@example.com"', '- inputText: "hello@orn-ui.dev"', 1100, '- hideKeyboard'],
    1: ['- tapOn: "Show password"', 900, '- tapOn: "Hide password"', 600],
  },
  'atoms/transition': {
    // The button's title toggles Show/Hide and the content starts visible.
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
    0: ['- tapOn: "Edit profile"', WAIT, 1400, '- tapOn: "Cancel"', WAIT],
    // The backdrop covers the whole screen: its center falls under the card,
    // so it's closed via an explicit point lower down (same as the test).
    1: ['- tapOn: "What\'s new"', WAIT, 1400, '- tapOn:\n    point: "50%,90%"', WAIT],
    2: ['- tapOn: "Open terms"', WAIT, 1400, '- tapOn: "Close"', WAIT],
  },
  'organisms/select': {
    // index: 1 — the field's label and value share text; 0 is the label.
    0: ['- tapOn:\n    text: "Payment method"\n    index: 1', WAIT, 1000, '- tapOn: "Cash"', WAIT],
  },
  'organisms/alert': {
    // Opens the real dialog (the whole screen dims) and closes it from the
    // backdrop, well below the card.
    0: ['- tapOn: "Send invoice"', WAIT, 1300, '- tapOn:\n    point: "50%,85%"', WAIT],
    // The destructive confirm: its own Cancel button, by point (the dialog's
    // buttons merge into one accessibility node).
    3: ['- tapOn: "Delete invoice"', WAIT, 1400, '- tapOn:\n    point: "31%,58%"', WAIT],
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
    // "Next", not "Continue": the label in flows/behavior/ is the validation
    // variant's, which passes its own labels. This one uses the component's.
    0: ['- tapOn: "Next"', 1000, '- tapOn: "Next"', 1000],
  },
  'organisms/list': {
    // The feed scrolls to its end (the next page loads under a footer
    // spinner), then the numbered switcher walks the other states.
    0: [
      '- swipe:\n    start: "50%,80%"\n    end: "50%,25%"\n    duration: 500',
      '- swipe:\n    start: "50%,80%"\n    end: "50%,25%"\n    duration: 500',
      1800,
      '- tapOn: "2"',
      1200,
      '- tapOn: "3"',
      1200,
      '- tapOn: "5"',
      1200,
      '- tapOn: "1"',
      800,
    ],
  },
  'organisms/search-list': {
    0: ['- tapOn: "Search..."', '- inputText: "ban"', 1300, '- tapOn: "Clear"', '- hideKeyboard', 700],
  },
  'organisms/reorderable-list': {
    0: ['- swipe:\n    from:\n      text: "Design review"\n    direction: DOWN\n    duration: 600', WAIT, 1000],
  },
  'organisms/date-picker': {
    // Days are named "<Month> <day>, <year>" for screen readers: matched by
    // day number so the clip works in any month.
    0: [900, '- tapOn: "[A-Za-z]+ 20, [0-9]+"', 1200],
    1: [900, '- tapOn: "[A-Za-z]+ 10, [0-9]+"', 600, '- tapOn: "[A-Za-z]+ 18, [0-9]+"', 1400],
    // The field opens the calendar in an overlay; picking a day closes it.
    // By point: "Due date" also matches the label above the field.
    6: [700, '- tapOn:\n    point: "50%,56%"', WAIT, 1300, '- tapOn: "[A-Za-z]+ 24, [0-9]+"', WAIT, 1300],
  },
  'organisms/chart': {
    // A still chart is an image; what has to be shown is that it responds.
    // The three selectors come from flows/behavior/chart-select-and-filter.yaml:
    // tapping a column opens the bubble and dims the rest, tapping the legend
    // removes a series, and the filter trims the data and redraws it.
    0: [
      '- tapOn:\n    id: "chart-interactive-band-1"',
      1200,
      '- tapOn:\n    id: "chart-interactive-legend-costs"',
      1000,
      '- tapOn:\n    id: "chart-interactive-filter-range-3"',
      1100,
    ],
  },
  'organisms/timeline': {
    // Tapping a milestone brings the line up to it, and tapping the one already
    // reached sends it back: both directions in a single variant. The selector
    // is the behavior flow's — targeting the text, Maestro considers the tap
    // done and the state doesn't change, because the node it finds isn't the Pressable.
    1: ['- tapOn:\n    id: "timeline-tap-press-4"', 1300, '- tapOn:\n    id: "timeline-tap-press-4"', 1100],
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

// Paging is the subflow that already exists for the tests, not a swipe of
// its own: the coordinates that advance exactly one page are calibrated
// there. A longer swipe builds up velocity and with `pagingEnabled` skips
// variants (see the comment in subflows/next-variant.yaml), which in a clip
// means a variant that's never seen.
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
      // Once past the last picked variant there's no need to keep paging:
      // the clip ends there.
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
    // No pager but with its own interaction (List, SearchList, Reorderable):
    // the clip is the interaction, not a scroll through content already visible.
    steps.push(beat(FIRST_BEAT_MS));
    steps.push(...render(interactions[0]));
  } else {
    // No pager: the demo hosts its own list (hostsList) or is a free-form
    // screen (freeScroll, the examples). There the clip shows the content
    // scrolling, which is all there is to show without specific interaction.
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

  const variantNote = labels ? `${labels.length} variant${labels.length === 1 ? '' : 's'}` : 'no variant catalog';

  return `# Generated by scripts/gen-maestro-demos.mjs — do not edit by hand.
# Source: ${manifestFile} (slug: ${entry.slug}) — ${variantNote}
#
# Clip for the docs, not a test. See .maestro/README.md.
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
    // The examples (SignIn, CheckoutWizard, …) have no page in the docs: they
    // are the catalog's sample screens, not documented components. Recording
    // their clip was half a minute of simulator per file that nobody serves.
    // The smoke suite does cover them — that doesn't change.
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
    if (checkOnly) console.error(`✗ out of date: .maestro/demos/${filename}`);
    else fs.writeFileSync(filePath, content);
  }
  for (const filename of stale) {
    changed = true;
    if (checkOnly) console.error(`✗ leftover: .maestro/demos/${filename}`);
    else fs.unlinkSync(path.join(DEMOS_DIR, filename));
  }

  if (checkOnly) {
    if (changed) {
      console.error('\nThe clip flows are out of date. Run: pnpm --filter example gen:maestro:demos');
      process.exit(1);
    }
    console.log(`✓ ${wanted.size} clip flows up to date (+${HAND_WRITTEN.size} hand-written)`);
    return;
  }
  console.log(`✓ Generated ${wanted.size} clip flows in .maestro/demos/ (+${HAND_WRITTEN.size} hand-written)`);
}

main();
