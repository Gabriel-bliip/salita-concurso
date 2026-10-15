# Salita - Shared AI Guidelines

Canonical instructions for all coding agents (Claude Code, Codex).
AGENTS.md and CLAUDE.md are pointers only. Never duplicate rules there.
If another instruction file contradicts this one, follow this file and report
the conflict. The user's request in the current task overrides these
guidelines, except the Git safety and Production safety rules, which need an
explicit user instruction naming the action.

<!-- VERIFY before merging: every file name below exists in main. Then delete this comment. -->

## Stack and commands
- Vite + React + TypeScript. Package manager: npm (never pnpm or yarn).
- npm run dev | npm run lint | npm run build | npm test
- Code, comments, identifiers and commit messages in English.
  UI text in Spanish (Chile).
- Design tokens (cream and burgundy) live in one place. No hardcoded colors
  in components.
- Never put secrets, API keys, .env files or personal data in the repo, in
  logs or in chat. Report the file and line only.

## Product decisions
- Pay-per-hour marketplace for work spaces in Santiago, Chile.
  NO subscriptions, NO monthly plans, NO hour balances.
- Open decisions, do not invent them: platform commission, cancellation
  policy, legal and privacy text (any placeholder must be marked provisional).
- Frontend only until a backend is explicitly introduced. Any future API call
  goes through one isolated service function, never directly from components.

## Scope and efficiency
- Optimize total work and rework, not prompt length. Define success from the
  user's request and implement directly when the scope is clear and small.
- For large, ambiguous or multi-file tasks, show a short plan and wait for
  approval before editing.
- Start with the files the user names. Read only directly relevant imports,
  types, tests and docs. Use targeted searches; avoid repository-wide scans,
  repeated reads and large tool outputs, unless the task is a repo-wide
  audit or cleanup.
- Make the smallest complete, correct change. Reuse existing code and
  patterns. No unrelated refactors, duplicate systems or speculative research.
- Do not browse the web unless the task requires it.
- If the requested behavior already works, verify it and change nothing.
- Always ask before: deleting or moving files, installing or removing
  dependencies, editing eslint, tsconfig, vite or package.json settings,
  and anything irreversible. Ask about other blockers only when they cannot
  be resolved safely from relevant context.
- Dependencies: no new ones without approval. The only pre-approved addition
  is Vitest, as the test runner.

## Salita invariants
- src/data/locations.json is the source of location data. Preserve records,
  IDs and backward compatibility unless explicitly told to migrate.
- Keep locations, categories and reservable unit types distinct. Use the
  shared catalogs (src/data/categories.ts, src/data/amenities.ts,
  src/lib/spaces.ts or their replacements). Never hardcode duplicates of them.
- amenityIds lists enabled amenities; omitted IDs are false. Extending a
  catalog must not require editing existing locations.
- Prices are integers in CLP, formatted with Intl.NumberFormat('es-CL').
  Price calculation lives in one isolated function (total = hours x price
  per hour).
- /admin is a lightweight, local-development-only editor. It derives options,
  relevant attributes and validations from the shared catalogs, and must not
  import public maps or booking UI.
- Edits and images must not persist before an explicit Save. Cancel leaves
  stored data unchanged. Validate writes and write atomically (temp file,
  then rename) so partial updates cannot happen.

## Production safety
- No admin write endpoints in production or reachable from outside. Enforce it
  in code: /admin and its write middleware exist only when
  import.meta.env.DEV is true and are absent from the production build.
- Never start the dev server with --host or expose it to the network.

## Tests
- For behavior-changing code, add or update focused automated tests for the
  change plus one relevant regression or extensibility case. Reuse existing
  test setup; do not create redundant suites. Run only affected tests.
- Test with temporary fixtures, never real location records.
- Before any commit that touches TypeScript, run npm run lint and
  npm run build. Run typecheck on its own if lint and build do not cover it.
- Report tests not run and unresolved failures honestly.

## Documentation
- Keep project documentation in docs/. Exceptions at the root: README.md,
  GUIDELINE.md, AGENTS.md and CLAUDE.md. Move legacy root docs only when in
  scope.
- Document implemented behavior, not proposals. Documentation-only changes
  need content review, not code tests.

## Git safety
- Never commit or push to main or master. Run `git branch --show-current`
  before committing.
- Never push unless the user asks. Never force-push, reset --hard, clean,
  discard changes, rebase or switch branches unless asked.
- Commit only when the user asks or the task says so. Use Conventional
  Commits: type(scope): imperative summary, e.g. feat(admin): support image
  URLs. Do not commit if nothing changed.
- Stage files by name, only task-owned changes. Never git add . blindly.
  Never commit .env or secrets. Preserve others' uncommitted work.

## Multi-agent handoff
- One agent per branch. Prefer a separate git worktree per agent so two
  agents never edit the same working directory at once.
- Treat committed code, tests and docs/ as shared truth across agents, not
  claims from earlier chats. Do not overwrite another agent's in-progress
  changes.

## Final reply
- Brief summary, targeted test results, commit hash if any, and any blocker.
  No code dumps unless requested. Explain non-obvious decisions in one or two
  lines.
