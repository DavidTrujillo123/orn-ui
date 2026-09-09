# CLAUDE.md

Read [`AGENTS.md`](AGENTS.md) before touching this repo — it holds the rules
that no compiler enforces (zero dependencies, Expo SDK 54-57, atomic design,
theme tokens, Gestalt, the nine-step component checklist).

Before saying a change is done:

```bash
pnpm harness                       # the checklist, machine-checked
pnpm --filter orn-ui test          # 90%/85% coverage gate
pnpm -r typecheck
pnpm compat                        # Expo SDK 54/55/56/57
```

If the change touches layout, gestures, animation or anything positional, jest
is not enough — add or run a Maestro flow against the example app
(`apps/example/.maestro/MAESTRO.md`).
