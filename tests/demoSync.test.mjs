import assert from 'node:assert/strict'
import test from 'node:test'
import { createSyncServer } from '../scripts/demo-sync-server.mjs'
import { startDemoSync } from '../src/corporate/sync.ts'

const ORIGIN = 'http://localhost:5173'

async function listen() {
  const server = createSyncServer()
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  return { server, url: `http://127.0.0.1:${server.address().port}` }
}

// Minimal EventSource over fetch (Node has no stable global one).
class FakeEventSource {
  constructor(url) {
    this.controller = new AbortController()
    fetch(url, { signal: this.controller.signal }).then(async (response) => {
      const decoder = new TextDecoder()
      let buffer = ''
      for await (const chunk of response.body) {
        buffer += decoder.decode(chunk, { stream: true })
        for (let end = buffer.indexOf('\n\n'); end >= 0; end = buffer.indexOf('\n\n')) {
          const line = buffer.slice(0, end).replace(/^data: /, '')
          buffer = buffer.slice(end + 2)
          this.onmessage?.({ data: line })
        }
      }
    }).catch(() => {})
  }
  close() { this.controller.abort() }
}

function memoryStore(initial) {
  let state = initial
  const listeners = new Set()
  return {
    adapter: {
      get: () => state,
      replace: (next) => { state = next; listeners.forEach((l) => l()) },
      subscribe: (l) => { listeners.add(l); return () => listeners.delete(l) },
    },
    set(next) { state = next; listeners.forEach((l) => l()) },
    get: () => state,
  }
}

const until = async (check) => {
  for (let i = 0; i < 100; i += 1) {
    if (check()) return
    await new Promise((resolve) => setTimeout(resolve, 20))
  }
  assert.fail('condition not met in time')
}

test('relay stores, replaces and clears the snapshot', async () => {
  const { server, url } = await listen()
  try {
    const put = await fetch(`${url}/state`, { method: 'PUT', body: JSON.stringify({ state: { n: 1 } }) })
    assert.deepEqual(await put.json(), { revision: 1, state: { n: 1 } })
    assert.equal((await (await fetch(`${url}/state`)).json()).state.n, 1)
    assert.equal((await fetch(`${url}/state`, { method: 'PUT', body: '[1]' })).status, 400)
    assert.equal((await fetch(`${url}/state`, { method: 'PUT', body: '{"state":[1]}' })).status, 400)
    assert.equal((await (await fetch(`${url}/state`, { method: 'DELETE' })).json()).state, null)
  } finally { server.closeAllConnections(); server.close() }
})

test('relay rejects foreign origins and oversized payloads', async () => {
  const { server, url } = await listen()
  try {
    assert.equal((await fetch(`${url}/state`, { headers: { Origin: 'https://evil.example' } })).status, 403)
    const ok = await fetch(`${url}/state`, { headers: { Origin: ORIGIN } })
    assert.equal(ok.headers.get('access-control-allow-origin'), ORIGIN)
    const big = await fetch(`${url}/state`, { method: 'PUT', body: JSON.stringify({ state: { x: 'a'.repeat(1_100_000) } }) }).catch(() => ({ status: 413 }))
    assert.equal(big.status, 413)
  } finally { server.closeAllConnections(); server.close() }
})

test('two sessions converge without echo loops', async () => {
  const { server, url } = await listen()
  globalThis.EventSource = FakeEventSource
  const company = memoryStore({ requests: [] })
  const employee = memoryStore({ requests: [] })
  const stops = [startDemoSync(company.adapter, url), startDemoSync(employee.adapter, url)]
  try {
    company.set({ requests: [{ id: 'r1', status: 'pending' }] })
    await until(() => employee.get().requests.length === 1)
    employee.set({ requests: [{ id: 'r1', status: 'approved' }] })
    await until(() => company.get().requests[0].status === 'approved')
    const { revision } = await (await fetch(`${url}/state`)).json()
    await new Promise((resolve) => setTimeout(resolve, 100))
    assert.equal((await (await fetch(`${url}/state`)).json()).revision, revision) // no ping-pong
  } finally {
    stops.forEach((stop) => stop())
    delete globalThis.EventSource
    server.closeAllConnections(); server.close()
  }
})
