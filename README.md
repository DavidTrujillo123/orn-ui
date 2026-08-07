# orn-ui

Fast, tree-shakeable, atomic-design component library for React Native.
**Zero runtime dependencies** — only `react` and `react-native` as peers. No
babel config, no metro config, no pods.

35 components across atoms, molecules and organisms, fully typed, themeable
(light/dark), with 246 tests and a 90%/85% (lines/branches) coverage gate in CI.

Live docs (props tables, demo snippets, install instructions per component):
**[orn-ui.dev](https://orn-ui.dev)**

## Install

Three ways to get components into your project — pick the one that fits:

**1. The whole package**

```bash
pnpm add orn-ui
```

```tsx
import { UIProvider, Button } from 'orn-ui';
```

**2. Just the components you import (subpath exports)**

Same package, but only the files you actually import end up in your bundle:

```tsx
import { UIProvider } from 'orn-ui/theme';
import { Button } from 'orn-ui/button';
```

**3. Copy the source into your project, no npm dependency**

```bash
npx orn-ui add button select wizard
```

Resolves transitive dependencies (e.g. `wizard` also pulls `steps`, `button`
and `core`), writes the actual `.tsx` source under `src/components/ui/`
(configurable), preserving the folder structure so relative imports keep
working untouched. `npx orn-ui add --all` installs the entire catalog this
way. `npx orn-ui --help` for all commands.

## Quick start

```tsx
import { UIProvider, Button, Card, Title } from 'orn-ui';
import { useSafeAreaInsets, SafeAreaProvider } from 'react-native-safe-area-context';

function App() {
  const insets = useSafeAreaInsets();
  return (
    <SafeAreaProvider>
      <UIProvider mode="system" insets={insets}>
        <Card>
          <Title>Hello orn-ui</Title>
          <Button title="Continue" onPress={() => {}} />
        </Card>
      </UIProvider>
    </SafeAreaProvider>
  );
}
```

`UIProvider` is the single entry point: it resolves light/dark (system or
manual override) and injects theme, icons, safe-area insets and labels to
the whole tree. `mode` can be `'system' | 'light' | 'dark'`, controlled via
`mode`/`onModeChange` or left uncontrolled with `defaultMode`.

## Component catalog

**Atoms** — `Title`/`Subtitle`/`Body`/`Caption`, `Button`, `IconButton`,
`Input`, `Checkbox`, `Badge`, `Card`, `Divider`, `Avatar`, `Image`, `Spinner`,
`EmptyState`, `KeyValueRow`, `Fab`, `PressableScale`

**Molecules** — `Stepper`, `OptionCard`, `InfoRow`, `FormActions`,
`AvatarHeader`, `ThemeToggle`, `Steps`

**Organisms** — `Modal`, `BottomSheet`, `Select`, `Alert`/`AlertProvider`,
`Screen`, `List`, `SearchList`, `Toast`/`ToastProvider`, `DatePicker`,
`DateField`, `Wizard`

Full props tables and live-recorded demo GIFs for every one of these: see
[orn-ui.dev](https://orn-ui.dev).

## Theming

```tsx
import { createTheme, UIProvider } from 'orn-ui';

const theme = createTheme({
  light: { colors: { primary: '#004cef' } },
  dark: { colors: { primary: '#3d7bff' } },
});

<UIProvider theme={theme}>{children}</UIProvider>;
```

Every component reads colors, spacing, radius, font size and duration from
theme tokens — no magic numbers. Icons are swappable too: pass your own
`icons` renderer to `UIProvider` to replace the built-in zero-dependency
glyphs.

## Repo structure

Monorepo (pnpm workspaces):

```
packages/ui/       orn-ui itself — the published package
apps/example/      Expo app exercising every component (dev harness, not published)
```

The docs site ([orn-ui.dev](https://orn-ui.dev)) lives in a separate
repo (`orn-ui-docs`) — it's a public deployable artifact with its own
release cycle, unlike `apps/example` which stays in this monorepo so it
always builds against the current source via `workspace:*`.

## Development

```bash
pnpm install
pnpm --filter orn-ui test          # or test:coverage
pnpm --filter orn-ui typecheck
pnpm --filter orn-ui build         # gen:exports + build:registry + bob build
pnpm --filter example typecheck
pnpm --filter example start        # Expo dev server for apps/example
```

`packages/ui`'s `build`/`prepare` scripts, in order:

1. `gen:exports` — regenerates the `package.json` subpath `exports` map
   from `src/`, one entry per component (`gen:exports:check` verifies it's
   not stale, run in CI).
2. `build:registry` — regenerates `registry/*.json`, the catalog the CLI
   (`bin/orn-ui.mjs`) reads to resolve and copy components + their
   transitive dependencies.
3. `bob build` — compiles `commonjs`/`module`/`typescript` targets to `lib/`.

Both generators derive everything from the real barrels
(`src/{atoms,molecules,organisms}/index.ts`) — there's no hand-maintained
list of components anywhere that can drift from the source.

## CI

On every push/PR: install, exports-map freshness check, typecheck (library +
example app), tests with the coverage gate, build, and a CLI smoke test that
runs `orn-ui add --all` into `apps/example` and typechecks the result —
end-to-end proof the install-by-component flow actually produces valid code,
not just that the registry JSON looks right.

## License

MIT
