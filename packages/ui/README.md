# orn-ui

Fast, tree-shakeable, atomic-design component library for React Native.
**Zero runtime dependencies** — only `react` and `react-native` as peers.

35 components (atoms, molecules, organisms), fully typed, themeable
(light/dark), 246 tests, 90%/85% (lines/branches) coverage gate.

Docs, props tables and demo GIFs: **[orn-ui-docs.vercel.app](https://orn-ui-docs.vercel.app/)**

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
// Custom theme
import { createTheme, UIProvider } from 'orn-ui';

const theme = createTheme({
  light: { colors: { primary: '#004cef' } },
  dark: { colors: { primary: '#3d7bff' } },
});

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
  `Spinner`, `EmptyState`, `KeyValueRow`, `Fab`, `PressableScale`
- **Molecules**: `Stepper`, `OptionCard`, `InfoRow`, `FormActions`,
  `AvatarHeader`, `ThemeToggle`, `Steps`
- **Organisms**: `Modal`, `BottomSheet`, `Select`, `Alert`/`AlertProvider`,
  `Screen`, `List`, `SearchList`, `Toast`/`ToastProvider`, `DatePicker`,
  `DateField`, `Wizard`

Every component's full prop table lives on [orn-ui-docs.vercel.app](https://orn-ui-docs.vercel.app/).

### SearchList & List Features
- **Search & Scan**: Buscador integrado con soporte para acción de escaneo e ítem extra.
- **Carga inicial con Skeleton**: Soporta `skeletonCount` y `renderSkeletonItem` para placeholders animados.
- **Pull-to-Refresh**: Integración nativa mediante `onRefresh` e `isRefreshing`.
- **Paginación & Headers/Footers**: `ListHeaderComponent` y `ListFooterComponent` conviven limpiamente con el indicador `isLoadingMore` y `noMoreText`.
- **Estado vacío no destructivo**: `ListEmptyComponent` conserva el header, footer y gestos de scroll/refresh.

### Worth knowing

- **Safe area, once.** A screen above a `NavigationBar` or tab bar takes
  `edges={['top']}` — applying the bottom inset on both counts the gesture bar
  twice and leaves an empty band.
- **Dates.** `DatePicker`/`DateField` both take `mode="range"`; `onClear` is
  what renders the clear button; month/weekday names, the modal title and the
  clear label come from `labels`.
- **`Steps`** scrolls its horizontal row rather than squeezing columns until
  React Native breaks labels mid-word.

## Why zero dependencies

No third-party runtime code means no supply-chain surface, no version
conflicts with the rest of your app, and no surprise breaking changes from a
transitive dependency. Icons are drawn with RN primitives (`View` + border +
transform), no icon font, no async asset loading — and swappable: pass your
own `icons` renderer to `UIProvider` to replace them.

## License

MIT
