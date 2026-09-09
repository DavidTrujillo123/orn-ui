# AGENTS.md

Instructions for AI coding agents working **in this repository** (the orn-ui
monorepo). If you are instead building an app that *consumes* orn-ui, read
[`packages/ui/AGENTS.md`](packages/ui/AGENTS.md) — that is the consumer-facing
guide, and it ships inside the npm package.

## Layout

```
packages/ui/       orn-ui itself — the published package (src/{atoms,molecules,organisms,theme,icons,safe-area})
apps/example/      Expo app exercising every component; builds against packages/ui/src via workspace:*
```

## Commands

```bash
pnpm install
pnpm --filter orn-ui test          # jest; test:coverage enforces 90%/85%
pnpm --filter orn-ui typecheck
pnpm --filter orn-ui build         # gen:exports + build:registry + bob build
pnpm compat                        # typecheck + tests on Expo SDK 54/55/56/57
pnpm example                       # Expo dev server for apps/example
pnpm harness                       # the repo's own checklist — run it before saying "done"
```

## Rules

- **Zero runtime dependencies is a hard constraint.** Only `react` and
  `react-native` may be imported by `src/`, with one exception:
  `src/safe-area/` may import `react-native-safe-area-context` (optional peer).
  A PR that adds a runtime dependency breaks the library's core promise.
- **Support Expo SDK 54 through 57.** Don't use APIs newer than React Native
  0.81 / React 19.1 without gating them; `pnpm compat` is what proves it.
- **Never hardcode colors, spacing, radii or durations** in a component. Read
  them from theme tokens (`theme.colors.*`, `theme.tokens.*`) through
  `createStyles`.
- **Don't hand-edit the generated parts of `packages/ui/package.json`**
  (`exports`) or `packages/ui/registry/*.json`. Run `pnpm --filter orn-ui
  build` — both are derived from the barrels in
  `src/{atoms,molecules,organisms}/index.ts`.
- **Atomic design is a dependency rule, not a folder convention.** `atoms/`
  can't import from `molecules/` or `organisms/`, `molecules/` can't import
  from `organisms/`. An atom is a single self-contained control; a molecule
  composes atoms; an organism owns state, gestures or portals.
- **Layout decisions are Gestalt decisions.** Grouping by proximity, one
  element breaking a series by similarity, figure/ground on top of arbitrary
  content, common fate for things that move together. Write the law you used in
  the component's doc comment — it's the "why" that survives the next edit.
- **Adding a component**: see the checklist below, and run `pnpm harness`.
- **Accessibility is part of the API**: `accessibilityLabel` is a required prop
  wherever the control has no visible text, and color pairs must clear WCAG AA
  (enforced by `src/theme/__tests__/palettes.test.ts` and `colors.test.ts`).
- Keep the counts in the READMEs (components, tests) truthful — run the suite
  before changing them.

## Adding a component

Nine steps. Skipping one leaves the repo internally inconsistent without
failing `tsc` or `jest`, which is exactly what `pnpm harness` is for — it
checks steps 1-8 and prints what's missing.

1. **Pick the layer** — `atoms/`, `molecules/` or `organisms/`, per the
   dependency rule above. Create `src/<layer>/<Name>.tsx`.
2. **Zero dependencies.** Only `react` and `react-native`. If the platform
   doesn't ship the primitive (a gradient, a gesture), compose it — see
   `atoms/Gradient.tsx` (bands instead of a native gradient) and
   `organisms/ReorderableList.tsx` (PanResponder instead of gesture-handler).
3. **Expo SDK 54-57.** Nothing newer than React Native 0.81 / React 19.1
   without gating it. `pnpm compat` is the proof, and it's the only one.
4. **Theme tokens only** — colors, spacing, radii and durations come from
   `createStyles((theme) => ...)`, never from literals.
5. **Accessibility** — `accessibilityLabel` wherever there's no visible text,
   plus `accessibilityRole`/`accessibilityState` on anything interactive.
6. **Export it** from `src/<layer>/index.ts` (value + types), then run
   `pnpm --filter orn-ui build` to regenerate `exports` and `registry/`.
7. **Test it** — `src/<layer>/__tests__/<Name>.test.tsx`. The coverage gate is
   90% lines / 85% branches, globally.
8. **Demo it** — `apps/example/demos/<Name>.demo.tsx` plus its entry in
   `demos/manifest.ts`, then `pnpm --filter example gen:maestro` for the smoke
   flow. Add the row to `README.md`, `packages/ui/README.md`,
   `packages/ui/AGENTS.md` and `packages/ui/llms.txt`, and bump the component
   counts in all four.
9. **Behavior flow, if it has gestures, animation or position** —
   `apps/example/.maestro/flows/behavior/<name>-<what>.yaml`. jest renders in
   jsdom: it can't see that a page is off-screen or that a parent scroll ate a
   gesture. See `.maestro/MAESTRO.md`.

## Harness

`pnpm harness` (`scripts/check-harness.mjs`) is the machine-checkable half of
the rules above:

| rule | what it checks |
|---|---|
| `components` | every exported component has a test, a demo, a manifest entry, a Maestro smoke flow, and a row in the four docs |
| `count` | the "N components" claims in the READMEs, `llms.txt` and `package.json` all match the catalog table |
| `deps` | nothing outside `react`/`react-native` is imported by `src/` (only `src/safe-area/` may import the optional peer) |
| `layers` | atomic design: no atom importing a molecule or organism, no molecule importing an organism |
| `theme` | no hardcoded colors in `atoms/`, `molecules/`, `organisms/` |
| `sdk` | the SDKs in `compat-matrix.mjs`, the `expo-sdk-*` keywords and the README all name the same range |
| `maestro` | every flow points at the real `appId` and at subflows that exist |

Run one rule at a time with `--rules deps,layers`.

What it **can't** check, and you still have to: whether the Gestalt reasoning
in the doc comment matches what the component actually does, whether it belongs
in the layer you put it in, and whether the Maestro flow asserts something a
render test couldn't. Those are judgment, and they're the reason the rules are
written down instead of only being linted.
