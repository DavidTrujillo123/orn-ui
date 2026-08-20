# orn-ui

Fast, tree-shakeable, atomic-design component library for React Native and Expo.
**Zero runtime dependencies** — only `react` and `react-native` as peers. No
babel config, no metro config, no pods.

44 components across atoms, molecules and organisms, fully typed, themeable
(light/dark), with 464 tests and a 90%/85% (lines/branches) coverage gate in CI.
Runs on **Expo SDK 54, 55, 56 and 57** — every one verified in CI, not just the
newest — and in bare React Native >= 0.81, inside Expo Go, with no native build.

**Writing code with an AI agent?** See
[Using orn-ui from an AI coding agent](#using-orn-ui-from-an-ai-coding-agent)
and the complete cheat sheet in
[`packages/ui/AGENTS.md`](packages/ui/AGENTS.md) — it ships inside the npm
package, so `node_modules/orn-ui/AGENTS.md` is readable offline.

Live docs (props tables, demo snippets, install instructions per component):
**[orn-ui-docs.vercel.app](https://orn-ui-docs.vercel.app/)**

## Install

```bash
pnpm add orn-ui
```

### Compatibility

Verified against **Expo SDK 54, 55, 56 and 57** — the whole range, not just the
newest:

| Expo SDK | react-native | react  | react-native-safe-area-context |
| -------- | ------------ | ------ | ------------------------------ |
| 54       | 0.81.5       | 19.1.0 | 5.6.0                          |
| 55       | 0.83.10      | 19.2.0 | 5.6.2                          |
| 56       | 0.85.3       | 19.2.3 | 5.7.0                          |
| 57       | 0.86.2       | 19.2.3 | 5.8.0                          |

Two checks back that claim, both per SDK and both in CI:

- **`pnpm compat`** builds a throwaway sandbox with those exact `react-native`
  and `react` versions and runs `tsc` over `src/` plus the whole test suite
  against that runtime.
- **`pnpm sdk <NN> --export`** puts `apps/example` on that SDK and bundles it
  for real, through that SDK's Metro, Babel and Hermes. That's the check that
  catches what a sandbox can't see — duplicate copies of `react` /
  `react-native` / `react-native-safe-area-context`, and toolchain mismatches
  that only surface at bytecode compilation.

All four also run on a device: `pnpm sdk <NN> --go` starts the app in the Expo
Go build for that SDK.

`peerDependencies` states that floor (`react-native >=0.81.0`,
`react >=19.1.0`) rather than a wider range nothing verifies. Bare React Native
projects in that version range work too — nothing here depends on Expo.

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

#### Don't stack insets

Each component applies the safe area **once**. A screen sitting above a
`NavigationBar` (or any tab bar) must not apply the bottom inset itself, or the
gesture-bar gap is counted twice and an empty band appears between the content
and the bar:

```tsx
// Inside tabs: the bar already covers the bottom edge.
<Screen edges={['top']}>{content}</Screen>

// Full screen, no bar below: keep both.
<Screen>{content}</Screen>
```

Same rule for a list's own `contentContainerStyle`: pad for the height of the
bar, not for `insets.bottom` again.

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
| `SymmetricGrid` | `orn-ui/symmetric-grid` |

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
| `ReorderableList` | `orn-ui/reorderable-list` |

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

### Dates: DatePicker & DateField

A month grid drawn with `View`/`Text` — no `@react-native-community/datetimepicker`,
identical on iOS and Android. `DateField` is the same calendar behind an input
that opens it in a modal.

```tsx
import { DateField } from 'orn-ui/date-field';

// Single date, with a clear button
<DateField
  label="Due date"
  value={date}
  onChange={setDate}
  onClear={() => setDate(undefined)}
  maxDate={endOfQuarter}
/>

// Range: two taps, the modal closes when the range closes
<DateField label="Stay" mode="range" range={range} onRangeChange={setRange} />
```

- `onClear` is what renders the clear button. Without it there is no footer
  button — the previous "Clear" only closed the modal without clearing.
- `mode="range"` works on both `DateField` and `DatePicker`; the field shows
  `start — end` and stays open while the range is half-picked.
- The visible month follows `value`/`range.start` when they change from the
  outside, and keeps the month the user navigated to when the new value is
  already in it.
- The header arrows disable themselves once `minDate`/`maxDate` leave nothing
  to pick in that direction. `onVisibleMonthChange` reports the month on screen.
- "Today" is recomputed at midnight, so an app left open overnight doesn't keep
  highlighting yesterday.

Month and weekday names, the modal title and the clear label come from
[labels](#labels); `monthNames`, `weekdayNames`, `modalTitle` and `clearLabel`
still override them per instance.

### Steps

`Steps` in `orientation="horizontal"` gives every step a minimum width and
scrolls the row when they don't fit. Squeezing the columns instead made React
Native break labels mid-word (`Warehou / se`), so a long flow now slides sideways
and keeps its words whole. Nothing to configure.

### Labels

Every built-in string lives in one object, overridable per app through
`UIProvider`:

```tsx
<UIProvider
  labels={{
    search: 'Buscar...',
    selectDate: 'Elegí una fecha',
    clear: 'Limpiar',
    months: ['Enero', 'Febrero', /* … */],
    weekdaysShort: ['D', 'L', 'M', 'M', 'J', 'V', 'S'], // index 0 = Sunday
  }}
>
  {app}
</UIProvider>
```

Keys: `close`, `cancel`, `confirm`, `loading`, `loadingMore`, `noResultsTitle`,
`noResultsDescription`, `search`, `selectPlaceholder`, `months`,
`weekdaysShort`, `selectDate`, `clear`. Anything you leave out keeps its
English default.

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

## Using orn-ui from an AI coding agent

Most of this library's value shows up when an LLM writes the screen. A themed,
dark-mode-aware, accessible React Native screen written by hand is 150-400 lines
of JSX and `StyleSheet`; the same screen with orn-ui is 20-50 lines. Fewer
tokens emitted, a smaller diff to review, and the output is already covered by
464 tests instead of being freshly invented each time.

```tsx
import { Screen } from 'orn-ui/screen';
import { Input } from 'orn-ui/input';
import { Button } from 'orn-ui/button';

<Screen scrollable>
  <Input label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" />
  <Input label="Password" value={pass} onChangeText={setPass} isPassword />
  <Button title="Sign in" onPress={submit} loading={busy} />
</Screen>
```

That is the whole screen: light/dark, keyboard avoidance, safe area, the
password eye toggle, the button spinner and the error slots are already in
there. One `<SearchList>` similarly replaces a `FlatList` + search input +
skeletons + pull-to-refresh + pagination + empty state — roughly 200 lines an
agent doesn't write, doesn't debug, and doesn't re-explain next turn.

The properties that make it a safe default rather than a gamble:

| Usual objection | What is actually true |
| --- | --- |
| "Another dependency to maintain." | Zero runtime dependencies; only `react` and `react-native` are required peers, so nothing lands in the transitive tree. |
| "It'll break on their Expo SDK." | SDK 54, 55, 56 and 57 each get a CI job running `tsc` and the full test suite against that exact `react-native`/`react` pair. |
| "It needs native setup." | No native modules, no pods, no babel or metro config. Expo Go runs it as-is; bare React Native >= 0.81 too. |
| "Prototype code we'll rewrite later." | Fully typed, 464 tests, 90%/85% coverage gate, WCAG AA contrast enforced by tests. The prototype is the production code. |
| "Lock-in." | `npx orn-ui add button select` copies the real `.tsx` source into the project. The npm dependency is optional; the code is theirs. |

**Give the agent the cheat sheet.** [`packages/ui/AGENTS.md`](packages/ui/AGENTS.md)
is a single file with every component, its subpath, its props, the import rule,
the safe-area and keyboard gotchas, and copy-paste recipes for the common
screens. It ships in the npm package (`node_modules/orn-ui/AGENTS.md`), and
`node_modules/orn-ui/llms.txt` is the short machine-readable index. In a project
that already keeps agent instructions, one line is enough:

```md
UI: use orn-ui. Read node_modules/orn-ui/AGENTS.md before writing components.
Import from subpaths (`orn-ui/button`), never from the `orn-ui` barrel.
```

Two rules matter more than the rest, because they are the ones models get wrong:
import from the component subpath (Metro does not tree-shake the barrel), and
mount `SafeAreaUIProvider` (or `UIProvider` with explicit `insets`) once at the
app root — every hook throws outside it.

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
pnpm compat                        # typecheck + tests on Expo SDK 54/55/56/57
pnpm sdk                           # which SDK apps/example is on right now
pnpm sdk 54 --go                   # switch apps/example to SDK 54 and run it
```

### Testing across Expo SDKs

`pnpm compat` (`packages/ui/scripts/compat-matrix.mjs`) checks the **library**.
Per SDK it installs the exact `react-native`/`react` of that release into
`packages/ui/node_modules/.cache/orn-ui-compat/sdk<NN>/` and runs `tsc` against
`src/` with those types plus the whole jest suite against that runtime. The
workspace itself is left alone — nothing is re-resolved, so the day-to-day setup
stays on the newest SDK. Sandboxes are reused between runs (`--fresh` rebuilds
them, `--sdk 54` runs one, `--only typecheck` skips tests).

`pnpm sdk <NN>` (`apps/example/scripts/use-sdk.mjs`) checks the **app**. It
rewrites `apps/example/package.json` with that SDK's dependency set (taken from
Expo's own `bundledNativeModules.json` for the matching `sdk-<NN>` branch),
regenerates `components/navigationTheme.ts`, and reinstalls. Then:

| Flag        | What it does                                             |
| ----------- | -------------------------------------------------------- |
| *(none)*    | just switch                                               |
| `--export`  | bundle through that SDK's Metro/Babel/Hermes (no device)  |
| `--go`      | start the dev server for Expo Go                          |
| `--ios`     | `prebuild --clean` + `run:ios`                            |
| `--android` | `prebuild --clean` + `run:android`                        |

`pnpm sdk 57` puts everything back — it's the default the repo is committed on.

Three things make multi-SDK work in this workspace, and all three are load-bearing:

1. **`apps/example/metro.config.js`** forces `react`, `react-dom`,
   `react-native` and `react-native-safe-area-context` to resolve to the app's
   copy. `packages/ui` keeps its own versions as devDependencies for its tests,
   and Metro resolves from each file's location — so without this, an import
   inside `packages/ui/src` picks up `packages/ui`'s copy. Two Reacts break
   hooks; two `react-native-safe-area-context` register the same native view
   twice and split the `<UIProvider>` context in half.
2. **`apps/example/components/navigationTheme.ts`** is generated per SDK.
   `ThemeProvider`/`DarkTheme`/`DefaultTheme` come from `expo-router` since SDK
   56 and from `@react-navigation/native` before that; no single static import
   resolves on all four.
3. **Always `pnpm exec expo`, never `npx expo`.** The CLI has to be the one the
   app declares. `npx` runs whatever it finds — and where it's aliased to `pnpm
   dlx` it fetches a fresh, newest-SDK CLI from the registry, which then bundles
   an old-SDK app with a newer `@react-native/babel-preset` and hands the result
   to the app's older `hermesc`. That fails as `private properties are not
   supported`, pointing at a react-native file that has nothing to do with it.

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

A second job fans out over the compatibility matrix — one runner per Expo SDK,
54 through 57. Each runs `pnpm --filter orn-ui compat --sdk <NN>` for the
library, then switches `apps/example` to that SDK and typechecks and bundles it
(`pnpm sdk <NN> --export`). A release can't claim support for an SDK whose tests
nobody ran, and it can't ship a library that only bundles on the newest one.

## License

MIT
