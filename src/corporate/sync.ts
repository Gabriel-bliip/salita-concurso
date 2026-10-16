// Development-only bridge that mirrors a store between browser sessions through
// scripts/demo-sync-server.mjs. It knows nothing about the booking workflow: the
// caller supplies get/replace/subscribe for whatever store holds the demo state.
export interface SyncAdapter<T> {
  get: () => T
  replace: (next: T) => void // must apply the state without re-triggering the subscription
  subscribe: (listener: () => void) => () => void
}

interface Snapshot<T> {
  revision: number
  state: T | null
}

export const DEMO_SYNC_URL = 'http://localhost:5175'

export function startDemoSync<T>(adapter: SyncAdapter<T>, baseUrl = DEMO_SYNC_URL): () => void {
  let applied = adapter.get() // last state known to match the relay
  let applying = false
  let lastRevision = 0

  const apply = (snapshot: Snapshot<T>) => {
    if (snapshot.revision <= lastRevision) return
    lastRevision = snapshot.revision
    if (snapshot.state === null) { push(); return } // relay was reset: re-seed it from this session
    if (JSON.stringify(snapshot.state) === JSON.stringify(adapter.get())) { applied = adapter.get(); return } // own echo
    applying = true
    applied = snapshot.state
    try { adapter.replace(snapshot.state) } finally { applying = false }
  }

  function push() {
    const state = adapter.get()
    applied = state
    fetch(`${baseUrl}/state`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ state }),
    }).then((response) => response.json()).then((snapshot: Snapshot<T>) => {
      lastRevision = Math.max(lastRevision, snapshot.revision) // our own echo is already applied
    }).catch(() => { /* relay offline: the session keeps working locally */ })
  }

  const unsubscribe = adapter.subscribe(() => {
    if (!applying && adapter.get() !== applied) push()
  })
  const events = new EventSource(`${baseUrl}/events`)
  events.onmessage = (event) => apply(JSON.parse(event.data) as Snapshot<T>)

  return () => {
    unsubscribe()
    events.close()
  }
}
