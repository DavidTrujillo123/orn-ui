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
- **Adding a component**: create it under the right atomic layer, export it from
  that layer's `index.ts`, add tests under `__tests__/`, regenerate exports and
  registry, add a screen in `apps/example`, and add the row to the catalog
  tables in `README.md`, `packages/ui/README.md`, `packages/ui/AGENTS.md` and
  `packages/ui/llms.txt`.
- **Accessibility is part of the API**: `accessibilityLabel` is a required prop
  wherever the control has no visible text, and color pairs must clear WCAG AA
  (enforced by `src/theme/__tests__/palettes.test.ts` and `colors.test.ts`).
- Keep the counts in the READMEs (components, tests) truthful — run the suite
  before changing them.
