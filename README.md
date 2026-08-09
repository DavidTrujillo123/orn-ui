# orn-ui

Fast, tree-shakeable, atomic-design component library for React Native.
**Zero runtime dependencies** — only `react` and `react-native` as peers. No
babel config, no metro config, no pods.

39 components across atoms, molecules and organisms, fully typed, themeable
(light/dark), with 426 tests and a 90%/85% (lines/branches) coverage gate in CI.

Live docs (props tables, demo snippets, install instructions per component):
**[orn-ui-docs.vercel.app](https://orn-ui-docs.vercel.app/)**

## Install

```bash
pnpm add orn-ui
```

Three ways to import — pick the one that fits:

**1. Subpath exports (recommended)**

Metro doesn't tree-shake named imports from a barrel — `import { Button }
from 'orn-ui'` pulls in every component the package exports, not just
`Button`. Import from the component's own subpath instead, and only that
file (plus what it actually depends on) ends up in your bundle:

```tsx
import { UIProvider } from 'orn-ui/theme';
import { Button } from 'orn-ui/button';
import { Select } from 'orn-ui/select';
```

Every component has one — see the [catalog](#component-catalog) for the
full subpath list, or run `npx orn-ui --help`. This is what the docs,
demos and this README use everywhere below; wherever you see
`import { X } from 'orn-ui'`, prefer `orn-ui/x` in real code.

One subpath is special: `orn-ui/safe-area` (see [Safe area](#safe-area)) is the
only file that imports a third-party package, and it's an optional peer.

**2. The barrel (`orn-ui`)**

```tsx
import { UIProvider, Button } from 'orn-ui';
```

Simplest for prototyping or small apps where bundle size doesn't matter yet.
Everything the package exports ships in your bundle, whether you use it or
not.

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
import { UIProvider } from 'orn-ui/theme';
import { Button } from 'orn-ui/button';
import { Card } from 'orn-ui/card';
import { Title } from 'orn-ui/title';
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

### Safe area

The library never imports `react-native-safe-area-context` — that's what keeps
it dependency-free. It reads plain numbers from `insets`, which default to
`{ top: 0, bottom: 0, left: 0, right: 0 }`. With zeros, `Screen`, `BottomSheet`
and the `full` modal variant render under the notch and against the gesture
bar, so wire them one of two ways.

**Automatic** — one import, insets measured for you:

```tsx
import { SafeAreaUIProvider } from 'orn-ui/safe-area';

export default function App() {
  return (
    <SafeAreaUIProvider defaultMode="system">
      <RootNavigator />
    </SafeAreaUIProvider>
  );
}
```

This subpath — and only this subpath — imports `react-native-safe-area-context`.
It's declared as an **optional** peer dependency: `import { Button } from 'orn-ui'`
never reaches that file, so the bundler never resolves it and installs that skip
the package keep working. `SafeAreaUIProvider` mounts `<SafeAreaProvider>` for
you; pass `mountSafeAreaProvider={false}` if your app already has one higher up.

**Manual** — if you'd rather not add the peer, or already call the hook:

```tsx
import { UIProvider } from 'orn-ui';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

function Providers({ children }) {
  return <UIProvider insets={useSafeAreaInsets()}>{children}</UIProvider>;
}

// useSafeAreaInsets() only works *inside* SafeAreaProvider:
<SafeAreaProvider><Providers>{app}</Providers></SafeAreaProvider>;
```

Any object with `top`/`bottom`/`left`/`right` works — the library doesn't care
where the numbers come from.

Omitting `insets` logs a one-time `__DEV__` warning, since the failure is
otherwise silent until someone opens a modal.

## Component catalog

Component name → subpath to import it from. Same list `npx orn-ui add`
resolves against.

**Atoms**

| Component | Subpath |
| --- | --- |
| `Title`/`Subtitle`/`Body`/`Caption` | `orn-ui/title` (also `/subtitle`, `/body`, `/caption`) |
| `Button` | `orn-ui/button` |
| `IconButton` | `orn-ui/icon-button` |
| `Input` | `orn-ui/input` |
| `Checkbox` | `orn-ui/checkbox` |
| `Badge` | `orn-ui/badge` |
| `Card` | `orn-ui/card` |
| `Divider` | `orn-ui/divider` |
| `Avatar` | `orn-ui/avatar` |
| `Image` | `orn-ui/image` |
| `Spinner` | `orn-ui/spinner` |
| `Skeleton` | `orn-ui/skeleton` |
| `EmptyState` | `orn-ui/empty-state` |
| `KeyValueRow` | `orn-ui/key-value-row` |
| `Fab` | `orn-ui/fab` |
| `PressableScale` | `orn-ui/pressable-scale` |
| `Transition` | `orn-ui/transition` |

**Molecules**

| Component | Subpath |
| --- | --- |
| `Stepper` | `orn-ui/stepper` |
| `OptionCard` | `orn-ui/option-card` |
| `InfoRow` | `orn-ui/info-row` |
| `FormActions` | `orn-ui/form-actions` |
| `AvatarHeader` | `orn-ui/avatar-header` |
| `SegmentedControl` | `orn-ui/segmented-control` |
| `Steps` | `orn-ui/steps` |

**Organisms**

| Component | Subpath |
| --- | --- |
| `Modal` | `orn-ui/modal` |
| `BottomSheet` | `orn-ui/bottom-sheet` |
| `Select` | `orn-ui/select` |
| `Alert`/`AlertProvider` | `orn-ui/alert`, `orn-ui/alert-provider` |
| `Screen` | `orn-ui/screen` |
| `List` | `orn-ui/list` |
| `SearchList` | `orn-ui/search-list` |
| `Toast`/`ToastProvider` | `orn-ui/toast`, `orn-ui/toast-provider` |
| `DatePicker` | `orn-ui/date-picker` |
| `DateField` | `orn-ui/date-field` |
| `Wizard` | `orn-ui/wizard` |
| `ThemeToggle` | `orn-ui/theme-toggle` |
| `NavigationBar` | `orn-ui/navigation-bar` |

Full props tables and live-recorded demo GIFs for every one of these: see
[orn-ui-docs.vercel.app](https://orn-ui-docs.vercel.app/).

### SearchList & List

`SearchList` integrates a search bar (with optional scan button and action slot) with a complete list supporting skeleton initial loading (`skeletonCount`, `renderSkeletonItem`), pull-to-refresh (`onRefresh`/`isRefreshing`), pagination (`onLoadMore`/`isLoadingMore`), coexisting `ListHeaderComponent`/`ListFooterComponent`, readiness state (`isReady`), and non-destructive empty state (`ListEmptyComponent`):

```tsx
import { SearchList } from 'orn-ui/search-list';

<SearchList
  searchValue={query}
  onSearchChange={setQuery}
  searchPlaceholder="Search clients..."
  data={page}
  keyExtractor={(c) => c.id}
  isLoading={isLoading}
  isRefreshing={isRefreshing}
  onRefresh={handleRefresh}
  onLoadMore={handleLoadMore}
  isLoadingMore={isLoadingMore}
  hasMore={hasMore}
  noMoreText="No more clients"
  emptyTitle="No clients found"
  renderItem={({ item }) => <ClientRow client={item} />}
/>
```

### Toasts and alerts from outside React

`useToast()` and `useAlert()` need a component. Business logic — a service, an
API interceptor, a queue worker — gets the same providers through plain
functions:

```tsx
import { showToast } from 'orn-ui/show-toast';
import { showConfirm } from 'orn-ui/show-confirm';

export async function deleteInvoice(id: string) {
  if (!(await showConfirm({ title: 'Delete invoice', destructive: true }))) return;
  await api.delete(id);
  showToast({ title: 'Invoice deleted', variant: 'success' });
}
```

They target the mounted provider. With none mounted they warn in `__DEV__` and
no-op — `showConfirm` resolves `false` and `showAlert` resolves immediately, so
an `await` never hangs.

## Theming

One hex is enough. `brand` derives the whole accent family — fill, the color
that goes **on** that fill, the tinted background and the readable variant —
for light **and** dark, with the contrast already solved:

```tsx
import { createTheme, UIProvider } from 'orn-ui/theme';

const theme = createTheme({ brand: '#7c3aed' });

<UIProvider theme={theme}>{children}</UIProvider>;
```

A bare string sets `primary`. Pass an object to reach the other accents; the
ones you leave out keep their defaults:

```tsx
createTheme({ brand: { primary: '#7c3aed', success: '#059669' } });
```

Every component reads colors, spacing, radius, font size and duration from
theme tokens — no magic numbers. Icons are swappable too: pass your own
`icons` renderer to `UIProvider` to replace the built-in zero-dependency
glyphs.

### Color roles

Each accent (`primary`, `secondary`, `success`, `error`, `warning`) ships in
four roles, and they are not interchangeable:

| Role | Use for | Example |
| --- | --- | --- |
| `primary` | solid fill | button background, selected day, FAB |
| `onPrimary` | text/icon **on** that fill | the label inside a primary button |
| `primarySoft` | tinted background | selected row, avatar circle, badge pill |
| `primaryText` | accent-colored text/icon on `surface`, `background` or its own `*Soft` | link button, badge label, error message |

`brand` fills all four for you. Reach for `colors` when a single derived role
is not what you want — it is applied after `brand`, so what you write wins,
and `createTheme` deep-merges, so untouched roles keep their value:

```tsx
createTheme({
  brand: '#7c3aed',
  colors: { dark: { primarySoft: '#241b3a' } },
});
```

Every default pair clears WCAG AA (4.5:1) in both schemes, enforced by
`src/theme/__tests__/palettes.test.ts`, and so does every family `brand`
derives (`src/theme/__tests__/colors.test.ts`). If instead you write an accent
by hand through `colors`, write its `on*`/`*Text` companions too — a light
fill with light text fails the same way whether the library or your theme
picked it.

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

## Running the example app

`apps/example` is an Expo app that browses the whole catalog — one screen per
component with its variants, plus an **Examples** tab with full integration
flows (invoice form, sign in, settings, order tracking, client list, checkout
wizard). It builds against `packages/ui/src` directly through `workspace:*`,
so edits to the library show up on reload with no rebuild step.

**Requirements:** Node 20+, [pnpm](https://pnpm.io) 10+, and the
[Expo Go](https://expo.dev/go) app on your phone (or Xcode / Android Studio
for a simulator).

```bash
git clone https://github.com/DavidTrujillo123/orn-ui.git
cd orn-ui
pnpm install
pnpm example                       # = pnpm --filter example start
```

That starts the Metro dev server and prints a QR code. Then:

| Target | How |
| --- | --- |
| Physical device | Scan the QR with Expo Go (Android) or the Camera app (iOS) |
| iOS simulator | Press `i` in the terminal |
| Android emulator | Press `a` |
| Web browser | Press `w` |

Useful keys while it runs: `r` reloads the app, `j` opens the debugger, `m`
toggles the dev menu, `Ctrl+C` stops the server.

The dev server takes port `8081`. If it's already in use:

```bash
pnpm --filter example start -- --port 8082   # or free it: lsof -ti:8081 | xargs kill -9
```

Cache acting up after a dependency change:

```bash
pnpm --filter example start -- --clear
```

Expo Go covers everything in this app — it has no custom native modules. You
only need a native build (`pnpm --filter example ios` / `android`, which run
`expo run:*` and require Xcode / Android Studio) if you add one.

## Development

```bash
pnpm install
pnpm --filter orn-ui test          # or test:coverage
pnpm --filter orn-ui typecheck
pnpm --filter orn-ui build         # gen:exports + build:registry + bob build
pnpm --filter example typecheck
pnpm example                       # Expo dev server for apps/example
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

Runs on pushed tags (`git tag v0.1.1 && git push origin v0.1.1`): install,
exports-map freshness check, typecheck (library +
example app), tests with the coverage gate, build, and a CLI smoke test that
runs `orn-ui add --all` into `apps/example` and typechecks the result —
end-to-end proof the install-by-component flow actually produces valid code,
not just that the registry JSON looks right.

## License

MIT
