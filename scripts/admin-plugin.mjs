import { createHash, randomUUID } from 'node:crypto'
import { readFileSync, openSync, writeFileSync, fsyncSync, closeSync, renameSync, unlinkSync, mkdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { validateLocation, validateLocationShape } from '../src/lib/locationSchema.ts'
import { normalizeLocation, withLocation, serializeLocation } from '../src/lib/location.ts'

const revision = (raw) => createHash('sha256').update(raw).digest('hex')
const local = (host) => ['localhost', '127.0.0.1', '[::1]'].includes(host)
const managed = /^\/images\/admin\/[a-f0-9-]+\.(png|jpg|webp)$/
function fail(message, status = 400) { throw Object.assign(new Error(message), { status }) }

function readSnapshot(file) {
  const raw = readFileSync(file, 'utf8')
  return { locations: JSON.parse(raw), revision: revision(raw) }
}

export function snapshot(file) {
  const current = readSnapshot(file)
  return { ...current, locations: current.locations.map(withLocation) }
}

// Shares the CLI lock. The JSON rename is the transaction commit point.
export function mutate(file, publicDir, request) {
  const lock = `${file}.lock`
  const temporary = `${file}.${randomUUID()}.tmp`
  let fd
  let tempFd
  const created = []
  try {
    try { fd = openSync(lock, 'wx') } catch (error) {
      if (error.code === 'EEXIST') fail('Otro proceso está guardando. Intenta nuevamente.', 409)
      throw error
    }
    const current = readSnapshot(file)
    if (request.revision !== current.revision) fail('Los datos cambiaron. Recarga el listado antes de guardar.', 409)
    const entries = current.locations
    const index = entries.findIndex(({ id }) => id === request.id)
    if (request.action !== 'create' && index < 0) fail('La ubicación ya no existe.', 404)
    let next
    if (request.action === 'delete') next = entries.filter(({ id }) => id !== request.id)
    else {
      if (!['create', 'update'].includes(request.action)) fail('Acción inválida.')
      const rawValue = structuredClone(request.location)
      if (!rawValue || typeof rawValue !== 'object') fail('Ubicación inválida.')
      validateLocationShape(rawValue)
      const value = normalizeLocation(rawValue)
      if (request.action === 'update' && value.id !== request.id) fail('No se puede cambiar el ID.')
      const uploads = []
      value.images = value.images.map((src) => {
        if (typeof src !== 'string') fail('Imagen inválida.')
        if (!src.startsWith('data:')) return src
        const match = /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/]+={0,2})$/.exec(src)
        if (!match) fail('Usa imágenes PNG, JPEG o WebP.')
        const bytes = Buffer.from(match[2], 'base64')
        const valid = match[1] === 'png' ? bytes.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex'))
          : match[1] === 'jpeg' ? bytes.subarray(0, 3).equals(Buffer.from('ffd8ff', 'hex'))
          : bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP'
        if (!valid || bytes.length > 5 * 1024 * 1024) fail('Imagen inválida o mayor de 5 MB.')
        const url = `/images/admin/${randomUUID()}.${match[1] === 'jpeg' ? 'jpg' : match[1]}`
        uploads.push({ url, bytes })
        return url
      })
      validateLocation(value, entries.filter((_, i) => request.action === 'create' || i !== index))
      for (const { url, bytes } of uploads) {
        const path = join(publicDir, url.slice(1))
        mkdirSync(join(publicDir, 'images/admin'), { recursive: true })
        writeFileSync(path, bytes, { flag: 'wx' })
        created.push(path)
      }
      const stored = serializeLocation(value, request.action === 'update' ? entries[index] : undefined)
      next = request.action === 'create' ? [...entries, stored] : entries.map((entry, i) => i === index ? stored : entry)
    }
    tempFd = openSync(temporary, 'wx')
    writeFileSync(tempFd, JSON.stringify(next, null, 2) + '\n')
    fsyncSync(tempFd)
    closeSync(tempFd)
    tempFd = undefined
    renameSync(temporary, file)
    created.length = 0
    // Only delete our own uploads, and only after their final reference is removed.
    const used = new Set(next.flatMap(({ images }) => images ?? []))
    for (const url of new Set(entries.flatMap(({ images }) => images ?? []))) {
      if (managed.test(url) && !used.has(url)) {
        try { unlinkSync(join(publicDir, url.slice(1))) } catch { /* Missing photos do not undo a committed save. */ }
      }
    }
    return snapshot(file)
  } finally {
    if (tempFd !== undefined) closeSync(tempFd)
    if (existsSync(temporary)) unlinkSync(temporary)
    for (const path of created) unlinkSync(path)
    if (fd !== undefined) { closeSync(fd); unlinkSync(lock) }
  }
}

export function adminPlugin() {
  return {
    name: 'salita-local-admin',
    apply: 'serve',
    transformIndexHtml: {
      order: 'pre',
      handler(html, context) {
        return /^\/admin\/?$/.test(context.originalUrl?.split('?')[0] ?? context.path)
          ? html.replace('/src/main.tsx', '/src/admin/main.tsx') : html
      },
    },
    configureServer(server) {
      const file = join(server.config.root, 'src/data/locations.json')
      server.middlewares.use(async (req, res, next) => {
        const path = req.url?.split('?')[0] ?? ''
        if (!/^\/(admin(?:\/|$)|__admin(?:\/|$)|src\/admin\/)/.test(path)) return next()
        const send = (status, value) => {
          res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' })
          res.end(JSON.stringify(value))
        }
        try {
          const host = new URL(`http://${req.headers.host}`)
          const peer = req.socket.remoteAddress
          if (!local(host.hostname) || !['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(peer)) fail('Solo disponible desde localhost.', 403)
          if (req.headers.origin && req.headers.origin !== host.origin) fail('Origen no permitido.', 403)
          if (req.headers['sec-fetch-site'] === 'cross-site') fail('Origen no permitido.', 403)
          if (!path.startsWith('/__admin')) return next()
          if (path !== '/__admin/locations') fail('Ruta desconocida.', 404)
          if (req.method === 'GET') return send(200, snapshot(file))
          if (req.method !== 'POST') fail('Método no permitido.', 405)
          if (req.headers.origin !== host.origin || req.headers['content-type'] !== 'application/json') fail('Solicitud no permitida.', 403)
          let size = 0
          const chunks = []
          for await (const chunk of req) {
            size += chunk.length
            if (size > 35 * 1024 * 1024) fail('El formulario supera 35 MB.', 413)
            chunks.push(chunk)
          }
          let body
          try { body = JSON.parse(Buffer.concat(chunks).toString('utf8')) } catch { fail('JSON inválido.') }
          send(200, mutate(file, server.config.publicDir, body))
        } catch (error) { send(error.status ?? 400, { error: error.message }) }
      })
    },
  }
}
