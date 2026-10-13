# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Stack

React 19 + TypeScript + Vite, npm. Frontend lives in `src/`. A Node.js TypeScript backend is planned but the framework is not decided — don't pick one or scaffold a backend without asking.

Business model: pay per hour only — no plans, subscriptions or hour balances. Price logic lives in `src/lib/pricing.ts`; cancellation policy and platform commission are not decided, so don't invent them.

## Commands

- `npm run dev` — Vite dev server (port 3000, set in `vite.config.ts`)
- `npm run lint` — ESLint (flat config, `eslint.config.js`)
- `npm run build` — `tsc -b && vite build`; type errors fail the build
- No test framework yet. Verify changes with `npm run lint` and `npm run build`.

## TypeScript gotchas (tsconfig.app.json)

- `erasableSyntaxOnly`: no `enum`, `namespace`, or constructor parameter properties — use union types / `as const` objects instead.
- `verbatimModuleSyntax`: type-only imports must use `import type`.
- `noUnusedLocals` / `noUnusedParameters`: unused code breaks `npm run build`, not just lint.
- `strict` is NOT enabled.
- Relative imports may include the `.tsx`/`.ts` extension (`allowImportingTsExtensions`).

## Style

No formatter configured. Match existing code: no semicolons, single quotes, 2-space indent, trailing commas.

## Git

Each developer works on their own branch named `rama-<name>` (e.g. `rama-dante`). Commit messages are in Spanish.
