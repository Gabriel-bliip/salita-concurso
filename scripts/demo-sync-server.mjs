// Development-only relay that keeps the two local demo sessions in sync.
// Holds one opaque JSON snapshot in memory and broadcasts changes over SSE.
// Binds to loopback only, accepts only the demo origins, and is never part of the build.
import { createServer } from 'node:http'
import { pathToFileURL } from 'node:url'

export const SYNC_PORT = 5175
const MAX_BODY = 1_000_000
const ORIGINS = new Set(['http://localhost:5173', 'http://localhost:5174', 'http://127.0.0.1:5173', 'http://127.0.0.1:5174'])

export function createSyncServer({ origins = ORIGINS } = {}) {
  let snapshot = { revision: 0, state: null }
  const clients = new Set()

  const broadcast = () => {
    const message = `data: ${JSON.stringify(snapshot)}\n\n`
    clients.forEach((res) => res.write(message))
  }

  const server = createServer((req, res) => {
    const origin = req.headers.origin
    if (origin && !origins.has(origin)) { res.writeHead(403).end(); return }
    if (origin) {
      res.setHeader('Access-Control-Allow-Origin', origin)
      res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS')
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
      res.setHeader('Vary', 'Origin')
    }
    if (req.method === 'OPTIONS') { res.writeHead(204).end(); return }

    const json = (status, body) => {
      res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }).end(JSON.stringify(body))
    }

    if (req.url === '/events' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-store', Connection: 'keep-alive' })
      res.write(`data: ${JSON.stringify(snapshot)}\n\n`)
      clients.add(res)
      req.on('close', () => clients.delete(res))
      return
    }
    if (req.url !== '/state') { json(404, { error: 'Not found' }); return }
    if (req.method === 'GET') { json(200, snapshot); return }
    if (req.method === 'DELETE') {
      snapshot = { revision: snapshot.revision + 1, state: null }
      broadcast()
      json(200, snapshot)
      return
    }
    if (req.method !== 'PUT') { json(405, { error: 'Method not allowed' }); return }

    let size = 0
    const chunks = []
    req.on('data', (chunk) => {
      size += chunk.length
      if (size > MAX_BODY) { json(413, { error: 'Payload too large' }); req.destroy(); return }
      chunks.push(chunk)
    })
    req.on('end', () => {
      if (res.writableEnded) return
      let body
      try { body = JSON.parse(Buffer.concat(chunks).toString('utf8')) } catch { json(400, { error: 'Invalid JSON' }); return }
      if (!body || typeof body !== 'object' || Array.isArray(body.state) || typeof body.state !== 'object' || body.state === null) {
        json(400, { error: 'Expected { state: object }' })
        return
      }
      snapshot = { revision: snapshot.revision + 1, state: body.state }
      broadcast()
      json(200, snapshot)
    })
  })
  return server
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  createSyncServer().listen(SYNC_PORT, '127.0.0.1', () => {
    console.log(`[demo-sync] http://127.0.0.1:${SYNC_PORT} (development only)`)
  })
}
