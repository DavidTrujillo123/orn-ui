# Contributing

A contribution to orn-ui usually touches **two repositories**:

```
orn-ui/          the library, its tests, the example app and the Maestro flows
orn-ui-docs/     the documentation site (separate repo, checked out as a sibling)
```

A component that only exists in the first one is invisible; a page in the
second one that documents a component nobody can install is a lie. The
checklist below walks the whole path so neither happens.

If you are an AI agent working in this repo, read [`AGENTS.md`](AGENTS.md)
instead — same rules, written as instructions rather than prose.

## Setup

```sh
pnpm install                    # Node 22, pnpm 10 (see packageManager)
pnpm example                    # Expo dev server for apps/example
pnpm harness                    # the repo's own checklist — run before "done"
```

For the Maestro flows you also need macOS, Xcode with an iOS Simulator
runtime, and the Maestro CLI:

```sh
curl -Ls "https://get.maestro.mobile.dev" | bash
```

## The hard constraints

These are not style preferences. Breaking one breaks the library's promise, and
`pnpm harness` fails on most of them:

- **Zero runtime dependencies.** `src/` may import `react` and `react-native`
  and nothing else. The one exception is `src/safe-area/`, which may import
  `react-native-safe-area-context` as an optional peer. If the platform doesn't
  ship a primitive, compose it — `atoms/Gradient.tsx` builds a gradient out of
  bands, `organisms/ReorderableList.tsx` uses `PanResponder` instead of
  gesture-handler.
- **Expo SDK 54 through 57.** Nothing newer than React Native 0.81 / React 19.1
  without gating it. `pnpm compat` is the proof.
- **Theme tokens only.** No hardcoded colors, spacing, radii or durations —
  they come from `createStyles((theme) => ...)`.
- **Atomic design is a dependency rule.** `atoms/` cannot import from
  `molecules/` or `organisms/`; `molecules/` cannot import from `organisms/`.
- **Accessibility is part of the API.** `accessibilityLabel` is required
  wherever a control has no visible text, plus `accessibilityRole` and
  `accessibilityState` on anything interactive. Color pairs must clear WCAG AA.

The full rationale for each is in [`AGENTS.md`](AGENTS.md).

## Adding a component, end to end

### 1. The component

`packages/ui/src/<layer>/<Name>.tsx`, in the layer its dependencies allow.
Export it from `src/<layer>/index.ts` (the value *and* its types), then:

```sh
pnpm --filter orn-ui build      # regenerates package.json "exports" and registry/
```

Never hand-edit those two — they are derived from the barrels.

### 2. Unit tests

`packages/ui/src/<layer>/__tests__/<Name>.test.tsx`.

```sh
pnpm --filter orn-ui test
pnpm --filter orn-ui test:coverage   # the gate: 90% lines, 85% branches, global
```

### 3. A demo in the example app

`apps/example/demos/<Name>.demo.tsx`, plus its entry in `demos/manifest.ts`.

The demo is not a scratchpad: it is the source of truth for three other things.
It feeds the app's catalogue, the docs' code snippet, and the recorded clip. A
demo file exports a `VariantDef[]` — one entry per variant, each with a `label`
and its `content`:

```tsx
const variants: VariantDef[] = [
  { label: 'Default', content: <Thing /> },
  { label: 'disabled', content: <Thing disabled /> },
];
return <VariantList variants={variants} />;
```

Wrap the part meant to be published as a snippet in `// #region demo` /
`// #endregion demo`.

```sh
pnpm example                    # look at it on a device before moving on
```

### 4. Maestro flows

[Maestro](https://maestro.dev) drives the real app on a real simulator through
the platform's accessibility tree. It is not a second unit-test suite: it
exists to catch what `jest` structurally cannot. Two real bugs — a BottomSheet
rendered above the screen, a ReorderableList whose drag was eaten by a parent
scroll — passed the entire jest suite, because the text *was* there, just in
the wrong place.

There are three kinds of flow, and they are not interchangeable:

| where | what it is | who writes it |
|---|---|---|
| `.maestro/flows/smoke/` | deep-link into the demo, assert it rendered | generated |
| `.maestro/flows/behavior/` | the real interaction: gestures, position, dismissal | you, by hand |
| `.maestro/demos/` | the clip the documentation site shows | generated, plus a table for interaction |

Smoke and clip flows are generated from the manifest:

```sh
pnpm --filter example gen:maestro          # smoke flows
pnpm --filter example gen:maestro:demos    # clip flows
```

Adding the manifest entry in step 3 is enough to get both. **Write a behavior
flow by hand** if the component has gestures, animation, portals or anything
positional — that is the only one that carries new signal.

```sh
cd apps/example
pnpm exec expo prebuild -p ios   # once, or after native config changes
pnpm e2e:ios:build               # Release build, JS bundled, no Metro
pnpm e2e:ios                     # or e2e:ios:smoke / e2e:ios:behavior
```

Things that will bite you, all documented in
[`apps/example/.maestro/MAESTRO.md`](apps/example/.maestro/MAESTRO.md):

- Selectors match the **accessibility tree**, not what you see. A `<Text>`
  inside a `Pressable` with its own `accessibilityLabel` is merged into one
  node, and the child text is not queryable on its own. A modal with
  `accessibilityViewIsModal` collapses further still — Alert's confirm dialog
  becomes a single screen-sized node labelled `"?, Delete invoice?, This cannot
  be undone., Cancel, Delete"`. When a label cannot be reached, tap by point:
  the merge is accessibility, not hit testing.
- A native `<Modal>` isolates its window from the rest of the tree, so nothing
  behind it can be used as an anchor.
- Page the variant list with `subflows/next-variant.yaml`. A longer swipe
  builds up enough velocity to skip a page.

### 5. The documentation site

In the sibling `orn-ui-docs` repo, see its
[`CONTRIBUTING.md`](https://github.com/DavidTrujillo123/orn-ui-docs/blob/main/CONTRIBUTING.md).
In short: a demo file, an
entry in `DOC_PAGES`, the "Usage" copy in both languages, and a recorded clip.

The docs install orn-ui **from npm**, so a brand-new component only shows up
there once a version containing it is published.

### 6. The counts and the checklist

A new component adds a row to `README.md`, `packages/ui/README.md`,
`packages/ui/AGENTS.md` and `packages/ui/llms.txt`, and bumps the component
count in all four. Then:

```sh
pnpm harness
```

It checks that every exported component has a test, a demo, a manifest entry, a
smoke flow and its four documentation rows; that the counts agree; that nothing
crept into the dependency list; that the layers are respected; that no color is
hardcoded; and that every Maestro flow points at a real `appId` and at subflows
that exist. Run a subset with `--rules deps,layers`.

What the harness cannot check, and you still have to: whether the component
belongs in the layer you put it in, whether its doc comment explains the
reasoning behind its layout, and whether your behavior flow asserts something a
render test couldn't.

## Fixing a bug

Smaller path, same shape: reproduce it in a test first. If the bug is
positional or gestural, the test that reproduces it is a Maestro behavior flow,
not a jest test — a jsdom render will happily pass while the sheet is off
screen. Name the flow after the regression and leave a comment saying which
commit broke it.

## Before opening a pull request

```sh
pnpm harness
pnpm --filter orn-ui typecheck
pnpm --filter example typecheck
pnpm --filter orn-ui test:coverage
pnpm --filter example gen:maestro:check
pnpm --filter example gen:maestro:demos:check
pnpm compat                       # slow: SDK 54-57, typecheck + tests each
```

Run these locally. **CI on this repo only runs on tags** (`.github/workflows/ci.yml`),
because that job also publishes to npm — a pull request gets no automatic
check. The iOS E2E workflow is `workflow_dispatch` only: a macOS runner with a
Release build costs around twenty minutes, and it is signal, not a gate.

## Commits

Conventional commits, in English, scoped to the area:
`feat(organisms):`, `fix(ci):`, `test(e2e):`, `docs:`, `chore:`.

Say what changed and why the change is shaped that way. The reason a swipe uses
explicit coordinates, or a component composes a primitive instead of importing
one, is the part that stops the next person from "simplifying" it back.

## Releasing

A tag runs the full CI matrix and publishes to npm. Bump the version in the
monorepo `package.json` and `packages/ui/package.json`, tag `vX.Y.Z`, push the
tag. Then update `orn-ui-docs` to that version so the site documents what is
actually installable.
