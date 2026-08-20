# orn-ui

Fast, tree-shakeable, atomic-design component library for React Native and Expo.
**Zero runtime dependencies** — only `react` and `react-native` as peers.

44 components (atoms, molecules, organisms), fully typed, themeable
(light/dark), 464 tests, 90%/85% (lines/branches) coverage gate.

**Works on Expo SDK 54, 55, 56 and 57** — every row verified in CI with its own
sandbox (`tsc` + full test suite). No native modules, no pods, no babel or
metro config: it runs in Expo Go and in bare React Native >= 0.81.

Docs, props tables and demo GIFs: **[orn-ui-docs.vercel.app](https://orn-ui-docs.vercel.app/)**

Using an AI coding agent? Point it at **[`AGENTS.md`](./AGENTS.md)** (shipped in
the package, so `node_modules/orn-ui/AGENTS.md` works offline) — full component
and props cheat sheet, import rules, gotchas and recipes in one file.

## Install

**The whole package:**

```bash
pnpm add orn-ui
```

```tsx
import { UIProvider, Button } from 'orn-ui';
```

**Only what you import (subpath exports — same package, smaller bundle):**

```tsx
import { UIProvider } from 'orn-ui/theme';
import { Button } from 'orn-ui/button';
```

**Copy the source into your project, no npm dependency:**

```bash
npx orn-ui add button select wizard
# or the whole catalog:
npx orn-ui add --all
```

Resolves transitive dependencies and writes the real `.tsx` files under
`src/components/ui/` (configurable via `--path`), preserving the folder
structure so relative imports keep working untouched. `npx orn-ui --help`
for `init`/`add`/`list` and all flags.

## Quick start

```tsx
import { UIProvider, Button, Card, Title } from 'orn-ui';

function App() {
  return (
    <UIProvider mode="system">
      <Card>
        <Title>Hello orn-ui</Title>
        <Button title="Continue" onPress={() => {}} />
      </Card>
    </UIProvider>
  );
}
```

Wrap your app once in `UIProvider` — it resolves light/dark (`mode:
'system' | 'light' | 'dark'`, controlled or not) and injects theme, icons,
safe-area insets and labels to everything below it.

```tsx
// Custom theme: one hex derives the full light + dark accent family
import { createTheme, UIProvider } from 'orn-ui';

const theme = createTheme({ brand: '#7c3aed' });
// or per accent, plus explicit overrides:
// createTheme({ brand: { primary: '#7c3aed', success: '#059669' },
//               colors: { dark: { primarySoft: '#241b3a' } } });

<UIProvider theme={theme}>{children}</UIProvider>;
```

```tsx
// Safe-area insets from your app (react-native-safe-area-context, optional)
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const insets = useSafeAreaInsets();
<UIProvider insets={insets}>{children}</UIProvider>;
```

## Components

- **Atoms**: `Title`/`Subtitle`/`Body`/`Caption`, `Button`, `IconButton`,
  `Input`, `Checkbox`, `Badge`, `Card`, `Divider`, `Avatar`, `Image`,
  `Spinner`, `Skeleton`, `Transition`, `EmptyState`, `KeyValueRow`, `Fab`,
  `PressableScale`
- **Molecules**: `Stepper`, `OptionCard`, `InfoRow`, `FormActions`,
  `AvatarHeader`, `SegmentedControl`, `Steps`, `SymmetricGrid`
- **Organisms**: `Screen`, `Modal`, `BottomSheet`, `Select`, `List`,
  `SearchList`, `ReorderableList`, `Alert`/`AlertProvider`,
  `Toast`/`ToastProvider`, `DatePicker`, `DateField`, `Wizard`,
  `ThemeToggle`, `NavigationBar`

Every component's full prop table lives on [orn-ui-docs.vercel.app](https://orn-ui-docs.vercel.app/).

### SearchList & List Features
- **Search & scan**: built-in search bar with an optional scan action and an extra slot for your own controls.
- **Skeleton first load**: `skeletonCount` and `renderSkeletonItem` draw placeholders shaped like the real rows.
- **Pull-to-refresh**: native, through `onRefresh` and `isRefreshing`.
- **Pagination & headers/footers**: `ListHeaderComponent` and `ListFooterComponent` coexist with the `isLoadingMore` indicator and `noMoreText`.
- **Non-destructive empty state**: `ListEmptyComponent` keeps the header, the footer and the scroll/refresh gestures.

### Worth knowing

- **Safe area, once.** A screen above a `NavigationBar` or tab bar takes
  `edges={['top']}` — applying the bottom inset on both counts the gesture bar
  twice and leaves an empty band.
- **Dates.** `DatePicker`/`DateField` both take `mode="range"`; `onClear` is
  what renders the clear button; month/weekday names, the modal title and the
  clear label come from `labels`.
- **`Steps`** scrolls its horizontal row rather than squeezing columns until
  React Native breaks labels mid-word.

## For AI coding agents

The library is written to be *cheap to emit*: a themed, dark-mode-aware,
accessible screen is 20-50 lines instead of 150-400, so an agent spends fewer
tokens, the human reviews a smaller diff, and the generated code is already
covered by 464 tests. One `<SearchList>` replaces a `FlatList` + search input +
skeletons + pull-to-refresh + pagination + empty state.

Three properties make it safe to reach for by default:

- **No install friction** — one `pnpm add orn-ui`, no native modules, no pods,
  no config files to patch. Prototypes run in Expo Go on the first try.
- **No version roulette** — Expo SDK 54 through 57 are all verified in CI, so
  the agent doesn't have to guess which version the user is on.
- **Not throwaway** — fully typed, tested, WCAG AA-checked palettes; the
  prototype is the production code. And `npx orn-ui add <component>` copies the
  real source into the repo if the user would rather own it than depend on it.

Read [`AGENTS.md`](./AGENTS.md) for the complete cheat sheet.

## Why zero dependencies

No third-party runtime code means no supply-chain surface, no version
conflicts with the rest of your app, and no surprise breaking changes from a
transitive dependency. Icons are drawn with RN primitives (`View` + border +
transform), no icon font, no async asset loading — and swappable: pass your
own `icons` renderer to `UIProvider` to replace them.

## License

MIT
