---
name: verify
description: Verify the project builds and lints cleanly by running npm run lint and npm run build. Use after making code changes and before committing.
---

Run these in order from the repo root:

1. `npm run lint`
2. `npm run build` (runs `tsc -b` then `vite build`)

If either fails, fix the reported errors (respecting the TypeScript rules in CLAUDE.md: no enums/namespaces/parameter properties, `import type` for types, no unused locals/params) and re-run until both pass.

Report the result: which commands passed, and what you fixed. There is no test suite yet, so this is the full verification.
