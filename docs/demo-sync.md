# Demo sync (two local sessions)

Development-only infrastructure so `/empresa` (port 5173) and `/empleado` (port 5174)
share the same simulated state. Not part of the production build.

## Pieces

- `scripts/demo.mjs` — launches both Vite instances and the relay (`node scripts/demo.mjs`).
- `scripts/demo-sync-server.mjs` — in-memory relay on `127.0.0.1:5175`. `GET /state`,
  `PUT /state` (`{ state }`), `DELETE /state`, `GET /events` (SSE). Accepts only the
  `localhost`/`127.0.0.1` origins of ports 5173/5174, 1 MB body limit, last write wins.
- `src/corporate/sync.ts` — `startDemoSync({ get, replace, subscribe })`. Store-agnostic;
  pushes local changes, applies remote ones, ignores its own echo.
- `tests/demoSync.test.mjs` — relay and two-session convergence tests.

## Integration

- `src/corporate/store.ts` exports `demoStoreAdapter` (get / subscribe / replace). `replace`
  keeps `bookingEmployeeId` local, so each session picks its own employee.
- `src/main.tsx` calls `startDemoSync(demoStoreAdapter)` only when `import.meta.env.DEV` is true.
- `DemoState` must stay JSON-serializable (plain objects, no `Date` or `Map`).
- If the relay is not running (plain `npm run dev`), the app works locally as before.
