# How Maestro works here

## What Maestro is

[Maestro](https://maestro.dev) is a mobile UI-testing tool. You write flows as
plain YAML — a list of commands like `tapOn`, `assertVisible`, `swipe`,
`inputText` — and the Maestro CLI drives them against a **real app running on
a real simulator/emulator**, through the platform's own automation driver
(XCUITest on iOS, UIAutomator on Android). It doesn't touch your JS — it
interacts with the compiled app exactly like a user would: it reads the
native accessibility tree (not pixels, not React component names) to find
elements, and taps/swipes/types through the OS.

That's the whole reason this suite exists: `jest`/RTL tests render components
in `jsdom` and never run on a real device, so they can't catch bugs where the
text is present but in the wrong *position*, or a gesture gets stolen by a
parent scroll view. Two such bugs (`BottomSheet` rendered above the screen,
`ReorderableList` drag broken on iOS) passed the full jest suite. Maestro
flows exist to catch that class of regression.

## How a flow is structured

```yaml
appId: com.anonymous.orn-ui-example
tags:
  - behavior
---
- launchApp
- tapOn: "Some Button"
- assertVisible: "Some Result"
```

- Everything above `---` is config (`appId`, `tags`, optional `env`).
- Everything below is the command list, run top to bottom.
- `runFlow: { file: ..., env: {...} }` composes flows — this repo uses it
  heavily so 45+ demos share one subflow instead of repeating deep-link
  boilerplate (see `subflows/`).
- Selectors match against the **accessibility tree**, not the visual text
  necessarily — a React Native `<Text>` inside a `Pressable` with its own
  `accessibilityLabel` often gets merged into ONE accessible node, and the
  child text may not be separately queryable even though it's visible on
  screen. This bit us repeatedly while writing new flows (see "Lessons
  learned" below).

## What you need installed

| Requirement | Why |
|---|---|
| macOS | iOS Simulator only runs on macOS. |
| Xcode + an iOS Simulator runtime | Provides the simulator and the XCUITest driver Maestro uses under the hood. |
| [Maestro CLI](https://maestro.dev) | `curl -Ls "https://get.maestro.mobile.dev" \| bash` |
| Node.js + pnpm | To build the Expo app and run the flow generator script. |
| CocoaPods | `expo run:ios` / `expo prebuild` shell out to `pod install`. |
| A booted iOS Simulator | `xcrun simctl boot "iPhone 17"` (or any device), or `maestro start-device --platform ios`. |

Maestro does **not** need Metro/the JS dev server running — the suite builds
a **Release** binary with the JS bundle embedded, specifically so tests run
against what ships, not against a dev server that could mask timing bugs.

## How to run the tests

```sh
cd apps/example

# One-time (or after native config changes):
pnpm exec expo prebuild -p ios

# Build a Release binary (no Metro, no --dev flag):
pnpm e2e:ios:build

# Run:
pnpm e2e:ios:smoke      # ~45 generated flows, one per demo — fast
pnpm e2e:ios:behavior   # hand-written flows with real interaction
pnpm e2e:ios            # everything
```

Under the hood these are just `maestro test --include-tags <tag> .maestro`
(see `package.json`). You can also run a single flow directly while
debugging:

```sh
maestro test .maestro/flows/behavior/wizard-step-validation.yaml
```

### Regenerating the smoke suite

Smoke flows (`flows/smoke/`) are generated from the component manifest, not
hand-written:

```sh
pnpm gen:maestro         # regenerates flows/smoke/*.yaml
pnpm gen:maestro:check   # fails if they're out of date (safe to run in CI)
```

Adding a component to `demos/manifest.ts` is enough to get smoke coverage —
no flow to write by hand. Hand-written flows only live in `flows/behavior/`,
for interaction a generic "open + assert title" can't exercise.

## Debugging a failure

Every run writes artifacts to `~/.maestro/tests/<timestamp>/`:

- `commands-(<flow name>).json` — every command executed, with a full
  accessibility-tree dump (`hierarchyRoot`) attached to whichever command
  failed. This is the ground truth when a selector doesn't match what the
  screenshot seems to show.
- `screenshot-❌-<ts>-(<flow name>).png` — screenshot at the moment of
  failure.
- `maestro.log` / `xctest_runner_*.log` — driver-level logs.

When a screenshot looks correct but the assertion still failed, don't guess —
read the `hierarchyRoot` in the matching `commands-*.json`. It tells you
exactly what text/labels were actually exposed to the accessibility tree at
that moment, which is often not what's visually painted (see below).

## Lessons learned writing this suite (real failures, not hypothetical)

- **Merged accessibility nodes.** A `Pressable`/`TouchableOpacity` with its
  own `accessibilityLabel` swallows its children's text into one node on
  iOS. `DateField`'s trigger, for example, always exposes `"Due date"` (the
  label) — never the placeholder or the picked value — because
  `accessibilityLabel={label ?? placeholder}` doesn't include the child
  `<Text>{value}</Text>` at all. Confirmed with a hierarchy dump: zero nodes
  containing the placeholder text, despite it being visibly painted. This
  is a real accessibility bug in the component, not just a test-selector
  problem.
- **Exact string match.** Maestro's plain-string selectors require an exact
  match, not substring. `EmptyState` fuses title + description into one
  node (`"No items, Try a different filter"`), so `assertVisible: "No
  items"` never matches — needs `assertVisible: ".*No items.*"`.
- **Duplicate text across screen and system chrome.** `"Sign in"` appeared
  3 times on one screen (demo title, card title, submit button). Anchor with
  a relative selector (`below: "some unique nearby text"`) instead of
  guessing an `index`.
- **`hideKeyboard` isn't reliable on every keyboard layout.** An `Input`
  without an explicit `keyboardType` gets the default keyboard, which shows
  a predictive-text suggestion bar and has no dedicated dismiss key on
  iPhone — `hideKeyboard` fails with "no dismiss action" there. `pressKey:
  Enter` works regardless of keyboard layout.
- **Pager swipes are not deterministic over long distances.** A calibrated
  swipe (same start/end/duration as the rest of the suite) reliably advances
  one `VariantList` page most of the time, but not always — 6 swipes in a
  row landed one page short in a live run, confirmed with a screenshot.
  Don't chain many swipes to reach a distant variant; prefer a screen where
  the interaction is reachable directly, or a shorter path.
- **System dialogs interrupt flows.** The iOS Simulator's "Save Password to
  Keychain?" prompt appears right after a successful login and covers the
  app. Handle it with an optional `runFlow: { when: { visible: "..." },
  commands: [...] }` block — it's a no-op on simulators where Keychain
  autofill is off.
- **Native `<Modal>` isolates its accessibility tree.** While a React Native
  `Modal` is open, anything outside it (e.g. the screen behind it) becomes
  unreachable to Maestro — confirmed live with `BottomSheet`/`Modal`. Anchor
  assertions to something that lives *inside* the modal (or a screen-relative
  `point:`), not to content on the screen behind it.
