# Salita Corporate — Shared AI Guidelines (Ideathon Avalanche Chile)

Canonical instructions for all coding agents (Claude Code, Codex, Antigravity).
AGENTS.md, CLAUDE.md and GEMINI.md are pointers only. Never duplicate rules
there. If another instruction file contradicts this one, follow this file and
report the conflict. The user's request in the current task overrides these
guidelines, except the Git safety, Production safety and Security rules, which
need an explicit user instruction naming the action.

---

## Stack and commands

- Vite + React + TypeScript. Package manager: **npm** (never pnpm or yarn).
- `npm run dev` | `npm run lint` | `npm run build` | `npm test`
- Code, comments, identifiers and commit messages in **English**.
  UI text in **Spanish (Chile)**.
- Design tokens (cream `#FFF8F0` and burgundy `#800020`) live in one place.
  No hardcoded colors in components.
- Never put secrets, API keys, `.env` files, private keys, seed phrases or
  personal data in the repo, in logs or in chat. Report the file and line only.

---

## Product vision — Salita Corporate on Avalanche

### Core proposition

Pay-per-hour marketplace for work spaces in Santiago, Chile — extended with a
**B2B corporate layer** where companies manage budgets so their employees can
book shared workspaces with on-chain traceability on **Avalanche**.

### Business-model hypothesis (to be shown in UI and docs)

| Element                 | Description |
|-------------------------|-------------|
| **Target customer**     | Mid-to-large companies that want to offer flexible workspace to distributed teams without long-term leases. |
| **Revenue model**       | Platform commission on each corporate booking (percentage TBD — mark as _provisional_). |
| **Avalanche value-add** | Immutable audit trail of corporate spend; multisig treasury for budget control; gasless UX for employees via account abstraction. |

### On-chain vs off-chain boundary

| Data layer   | What goes there | Rationale |
|--------------|-----------------|-----------|
| **On-chain** | Budget allocations, spend approvals, booking commitments (hash + timestamp), delegation grants and revocations. | Auditability, trustless spend caps, corporate governance. |
| **Off-chain** | Space catalogs, availability calendars, user profiles, images, reviews, detailed booking metadata. | Cost, latency, privacy (GDPR-style). |

> For the Ideathon the on-chain layer is **documented and simulated** in the
> frontend with synthetic data. Actual smart-contract deployment is deferred to
> the Hackathon phase.

### Open decisions

Do not invent answers for: exact commission percentage, cancellation policy
details, legal/privacy text, token denomination for budgets. Any placeholder
must be marked **provisional**.

---

## AVAXSKILLS integration — priority map

The project applies the following AVAXSKILLS guides. Priorities reflect the
Ideathon scope (navigable mockup + documented architecture) and preparation for
the subsequent Hackathon.

| Prio | AVAXSKILL              | Ideathon deliverable | Hackathon target |
|------|------------------------|----------------------|------------------|
| 1    | `safe-multisig`        | Mockup shows corporate treasury dashboard: budget creation, approval queue and multisig authorization flow (synthetic data). | Gnosis Safe / multisig integration on Fuji. |
| 2    | `account-abstraction`  | Mockup demonstrates gasless booking flow for employees — no AVAX required in their wallet. Documented paymaster design. | ERC-4337 bundler + paymaster on Fuji. |
| 3    | `evm-foundry`          | Architecture doc (`docs/contracts-architecture.md`) with contract interfaces, storage layout, on-chain/off-chain split. No deployment required today. | Foundry project with deploy scripts and Fuji verification. |
| 4    | `viem`                 | Isolated service layer in `src/services/` (TypeScript). Structures queries for corporate balances, delegated permissions and booking state. Returns synthetic/mock data for now. | Live reads from Fuji via viem. |
| 5    | `evm-wallet-integration` | UI components to connect admin and employee wallets. State is **simulated/synthetic** so the jury can navigate both roles without a real wallet. | Real wallet connection (Core, MetaMask) with chain switching. |
| 6    | `security`             | Strict rules enforced (see Security section below). Roles: Admin vs Employee. Spend caps. No private keys, seed phrases, `.env` or real PII in repo. | On-chain role checks + spend-cap modifiers in contracts. |
| 7    | `testing`              | Business-rule tests: spend limits, delegated permissions, cancellation logic, unauthorized-operation blocking. `npm run lint` and `npm run build` must pass clean. | Contract unit tests (Foundry) + integration tests. |

---

## Scope and efficiency — Ideathon rules

### Top priority: navigable mockup

1. **100 % navigable frontend** with synthetic/fictitious data, ready to deploy
   to a public URL (Vercel, Netlify or similar).
2. **Complete `README.md`** declaring:
   - Starting point (Salita base project).
   - AI tools used and how.
   - AVAXSKILLS table with applied guides and status.
3. Architecture documentation in `docs/`.

### Execution constraints

- Optimize total work and rework, not prompt length. Define success from the
  user's request and implement directly when the scope is clear and small.
- For large, ambiguous or multi-file tasks, show a short plan and wait for
  approval before editing.
- Start with the files the user names. Read only directly relevant imports,
  types, tests and docs. Use targeted searches; avoid repository-wide scans,
  repeated reads and large tool outputs, unless the task is a repo-wide audit.
- Make the smallest complete, correct change. Reuse existing code and patterns.
  No unrelated refactors, duplicate systems or speculative research.
- Do not browse the web unless the task requires it.
- If the requested behavior already works, verify it and change nothing.
- Always ask before: deleting or moving files, installing or removing
  dependencies, editing eslint, tsconfig, vite or package.json settings, and
  anything irreversible.

### Dependencies

No new dependencies without approval. Pre-approved additions:

| Package  | Purpose |
|----------|---------|
| Vitest   | Test runner |
| viem     | Avalanche/EVM service layer (AVAXSKILL P4) |

Any other dependency (wagmi, @safe-global/*, permissionless, etc.) requires
explicit user approval before installation.

---

## Salita invariants

- `src/data/locations.json` is the source of location data. Preserve records,
  IDs and backward compatibility unless explicitly told to migrate.
- Keep locations, categories and reservable unit types distinct. Use the shared
  catalogs (`src/data/categories.ts`, `src/data/amenities.ts`,
  `src/lib/spaces.ts` or their replacements). Never hardcode duplicates.
- `amenityIds` lists enabled amenities; omitted IDs are false. Extending a
  catalog must not require editing existing locations.
- Prices are integers in CLP, formatted with `Intl.NumberFormat('es-CL')`.
  Price calculation lives in one isolated function
  (`total = hours × price per hour`).
- `/admin` is a lightweight, local-development-only editor. It derives options,
  relevant attributes and validations from the shared catalogs, and must not
  import public maps or booking UI.
- Edits and images must not persist before an explicit Save. Cancel leaves
  stored data unchanged. Validate writes and write atomically (temp file, then
  rename) so partial updates cannot happen.

---

## Architecture — service layer (`src/services/`)

All blockchain and external-API interactions go through **isolated service
functions** in `src/services/`. Components never call RPC, wallet or contract
APIs directly.

```
src/services/
  corporateBudget.ts    # P1  – budget creation, approval queue, multisig state
  accountAbstraction.ts # P2  – gasless booking, paymaster status
  bookingContract.ts    # P3  – booking commitment hashes, on-chain state
  balances.ts           # P4  – corporate balance queries via viem
  permissions.ts        # P4  – delegated permissions, role checks
  walletConnection.ts   # P5  – connect/disconnect, account state
```

Each service exports pure async functions that today return **synthetic data**
and will be swapped to live RPC calls during the Hackathon.

---

## Security (AVAXSKILL P6)

- **Roles**: Admin (company treasury manager) and Employee (delegated spender).
  Role boundaries must be enforced in UI routing and service-layer guards.
- **Spend caps**: Every delegation includes a maximum amount. The service layer
  must reject any operation exceeding the cap, even with synthetic data.
- **Forbidden in the repo** (enforced by lint, review and CI):
  - Private keys, mnemonic / seed phrases.
  - `.env` files or environment variable values.
  - Real personal data (names, RUTs, emails of actual people).
  - Hardcoded RPC secrets or API tokens.
- **Wallet simulation**: The mockup uses synthetic wallet state so the jury can
  navigate without configuring a real wallet. No real funds or keys are ever
  involved.
- Never start the dev server with `--host` or expose it to the network.
- No admin write endpoints in production. `/admin` and its write middleware
  exist only when `import.meta.env.DEV` is true and are absent from the
  production build.

---

## Tests (AVAXSKILL P7)

- For behavior-changing code, add or update focused automated tests for the
  change plus one relevant regression or extensibility case. Reuse existing test
  setup; do not create redundant suites. Run only affected tests.
- Test with temporary fixtures, never real location records or real wallet data.
- **Business-rule coverage** (required for corporate flows):
  - Spend-limit enforcement (approve / reject over cap).
  - Delegated-permission grant and revoke.
  - Booking cancellation and refund-state transitions.
  - Unauthorized-operation blocking (employee attempts admin action).
- Before any commit that touches TypeScript, run `npm run lint` and
  `npm run build`. Both **must pass clean** — the mockup will be deployed
  publicly. Run typecheck on its own if lint and build do not cover it.
- Report tests not run and unresolved failures honestly.

---

## Documentation

- Keep project documentation in `docs/`. Exceptions at the root: `README.md`,
  `GUIDELINE.md`, `AGENTS.md`, `CLAUDE.md` and `GEMINI.md`. Move legacy root
  docs only when in scope.
- `docs/contracts-architecture.md` — smart-contract design, interfaces,
  storage, on-chain/off-chain split (AVAXSKILL P3).
- `docs/business-model.md` — hypothesis, customer segments, commission model,
  Avalanche value proposition (optional but encouraged).
- Document implemented behavior, not proposals — except for the Hackathon
  architecture docs which document **planned** contracts and are clearly labeled
  as such.
- Documentation-only changes need content review, not code tests.

---

## Git safety

- Never commit or push to `main` or `master`. Run `git branch --show-current`
  before committing.
- Work in **feature / prototype branches** (e.g.
  `feature/corporate-dashboard`, `feature/gasless-booking`).
- Never push unless the user asks. Never force-push, `reset --hard`, clean,
  discard changes, rebase or switch branches unless asked.
- Commit only when the user asks or the task says so. Use **Conventional
  Commits**: `type(scope): imperative summary`
  (e.g. `feat(corporate): add budget approval mockup`). Do not commit if
  nothing changed.
- **Stage files by name** (never `git add .` blindly), only task-owned changes.
  Never commit `.env` or secrets. Preserve others' uncommitted work.

---

## Multi-agent handoff

- One agent per branch. Prefer a separate git worktree per agent so two agents
  never edit the same working directory at once.
- Treat committed code, tests and `docs/` as shared truth across agents, not
  claims from earlier chats. Do not overwrite another agent's in-progress
  changes.

---

## Final reply

- Brief summary, targeted test results, commit hash if any, and any blocker.
  No code dumps unless requested. Explain non-obvious decisions in one or two
  lines.
