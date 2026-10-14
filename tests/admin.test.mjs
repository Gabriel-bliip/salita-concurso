import assert from 'node:assert/strict'
import test from 'node:test'
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync, readdirSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { get as httpGet } from 'node:http'
import { createServer } from 'vite'
import { adminPlugin, mutate, snapshot } from '../scripts/admin-plugin.mjs'
import { DATA_FILE } from '../scripts/spaces-add.mjs'
import { newLocation, newSpace, duplicateLocation, filterLocations } from '../src/admin/model.ts'

const original = readFileSync(DATA_FILE, 'utf8')
const png = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aF9sAAAAASUVORK5CYII='
function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'salita-admin-'))
  t.after(() => { rmSync(root, { recursive: true, force: true }); assert.equal(readFileSync(DATA_FILE, 'utf8'), original) })
  mkdirSync(join(root, 'src/data'), { recursive: true })
  const file = join(root, 'src/data/locations.json')
  writeFileSync(file, original)
  return { root, file, publicDir: join(root, 'public') }
}
function sample() {
  return { ...newLocation(), name: 'Ubicación de prueba', slug: 'ubicacion-de-prueba', description: 'Descripción de prueba', address: 'Calle 123', spaces: [{ ...newSpace('meeting_room'), name: 'Sala', description: 'Sala luminosa' }] }
}
function save(f, action, location, id, rev = snapshot(f.file).revision) {
  return mutate(f.file, f.publicDir, { action, location, id, revision: rev })
}

test('admin CRUD preserves existing records, IDs, captions and unknown properties', (t) => {
  const f = fixture(t)
  const value = { ...sample(), extra: { preserved: true } }
  const created = save(f, 'create', value)
  assert.deepEqual(created.locations.slice(0, -1), JSON.parse(original))
  const updated = save(f, 'update', { ...value, name: 'Nuevo nombre' }, value.id)
  assert.equal(updated.locations.at(-1).id, value.id)
  assert.deepEqual(updated.locations.at(-1).extra, value.extra)
  const duplicate = duplicateLocation(updated.locations.at(-1), updated.locations)
  assert.notEqual(duplicate.id, value.id)
  assert.notEqual(duplicate.spaces[0].id, value.spaces[0].id)
  assert.notEqual(duplicate.slug, value.slug)
  save(f, 'create', duplicate)
  save(f, 'delete', undefined, duplicate.id)
  const deleted = save(f, 'delete', undefined, value.id)
  assert.deepEqual(deleted.locations, JSON.parse(original))
  const legacy = deleted.locations.find((entry) => !entry.images.length && entry.photoCaptions.length)
  assert.ok(legacy)
  const legacyUpdated = save(f, 'update', { ...legacy, name: `${legacy.name} editado` }, legacy.id)
  assert.deepEqual(legacyUpdated.locations.find(({ id }) => id === legacy.id).photoCaptions, legacy.photoCaptions)
  assert.deepEqual(readdirSync(join(f.root, 'src/data')), ['locations.json'])
})

test('admin validates changes and prevents stale saves, duplicate IDs and CLI lock collisions', (t) => {
  const f = fixture(t)
  const value = sample()
  const rev = snapshot(f.file).revision
  save(f, 'create', value)
  const before = readFileSync(f.file, 'utf8')
  assert.throws(() => save(f, 'delete', undefined, value.id, rev), /cambiaron/)
  assert.throws(() => save(f, 'create', value), /identificador/)
  assert.throws(() => save(f, 'update', { ...value, id: 'changed' }, value.id), /ID/)
  assert.throws(() => save(f, 'update', { ...value, location: { latitude: 91, longitude: 0 } }, value.id), /Latitud/)
  assert.throws(() => save(f, 'update', { ...value, openingHours: { ...value.openingHours, 1: { open: 18, close: 9 } } }, value.id), /cierre/)
  assert.throws(() => save(f, 'update', { ...value, spaces: [{ ...value.spaces[0], pricePerHour: -1 }] }, value.id), /Precio/)
  assert.throws(() => save(f, 'delete', undefined, 'missing'), /existe/)
  writeFileSync(`${f.file}.lock`, '')
  assert.throws(() => save(f, 'delete', undefined, value.id), /proceso/)
  rmSync(`${f.file}.lock`)
  assert.equal(readFileSync(f.file, 'utf8'), before)
  assert.deepEqual(readdirSync(join(f.root, 'src/data')), ['locations.json'])
})

test('images persist only on valid saves and are removed after their final reference', (t) => {
  const f = fixture(t)
  const value = { ...sample(), images: [png], photoCaptions: ['Imagen temporal'] }
  const created = save(f, 'create', value).locations.at(-1)
  const imageFile = join(f.publicDir, created.images[0].slice(1))
  assert.ok(existsSync(imageFile))
  assert.equal(readFileSync(imageFile).toString('base64'), png.split(',')[1])
  const copy = duplicateLocation(created, [created])
  save(f, 'create', copy)
  save(f, 'delete', undefined, created.id)
  assert.ok(existsSync(imageFile))
  save(f, 'update', { ...copy, images: [], photoCaptions: [] }, copy.id)
  assert.ok(!existsSync(imageFile))
  const before = snapshot(f.file)
  assert.throws(() => save(f, 'update', { ...copy, images: ['data:image/png;base64,YmFk'], photoCaptions: ['Mala'] }, copy.id), /Imagen/)
  assert.throws(() => save(f, 'update', { ...copy, images: [png], photoCaptions: ['Buena'], name: '' }, copy.id), /Nombre/)
  assert.deepEqual(snapshot(f.file), before)
  assert.deepEqual(readdirSync(join(f.publicDir, 'images/admin')), [])
})

test('sparse legacy records round-trip through admin without materializing defaults or losing extras', (t) => {
  const f = fixture(t)
  const legacy = { ...sample(), custom: { retained: false } }
  for (const key of ['categoryId', 'amenityIds', 'rules', 'images', 'photoCaptions', 'spaces', 'openingHours']) delete legacy[key]
  writeFileSync(f.file, JSON.stringify([legacy, ...JSON.parse(original)]))
  const value = snapshot(f.file).locations[0]
  assert.deepEqual(value.images, [])
  assert.equal(value.categoryId, 'cowork')
  save(f, 'update', { ...value, description: 'Descripción modificada' }, value.id)
  const stored = JSON.parse(readFileSync(f.file, 'utf8'))
  assert.deepEqual(stored[0], { ...legacy, description: 'Descripción modificada' })
  assert.deepEqual(stored.slice(1), JSON.parse(original))
  save(f, 'delete', undefined, value.id)
  assert.deepEqual(JSON.parse(readFileSync(f.file, 'utf8')), JSON.parse(original))
})

test('admin creates compact optional data and validates malformed values before normalization', (t) => {
  const f = fixture(t)
  const value = { ...sample(), spaces: [], openingHours: {}, contact: {}, attributes: {} }
  save(f, 'create', value)
  const stored = JSON.parse(readFileSync(f.file, 'utf8')).at(-1)
  for (const key of ['images', 'photoCaptions', 'rules', 'spaces', 'amenityIds', 'openingHours', 'contact', 'attributes']) assert.ok(!Object.hasOwn(stored, key), key)
  const before = readFileSync(f.file, 'utf8')
  for (const patch of [{ images: null }, { amenityIds: false }, { openingHours: null }, { rules: 'text' }]) {
    assert.throws(() => save(f, 'update', { ...value, ...patch }, value.id))
    assert.equal(readFileSync(f.file, 'utf8'), before)
  }
})

test('search combines category, comuna, service and reservable unit filters', () => {
  const a = { ...sample(), name: 'Árbol', amenityIds: ['wifi'], categoryId: 'cowork' }
  const b = { ...sample(), name: 'Arbol segundo', categoryId: 'taller-arte' }
  const filters = { name: 'ARBOL', category: '', comuna: '', amenity: '', type: '' }
  assert.deepEqual(filterLocations([a, b], filters), [a, b])
  assert.deepEqual(filterLocations([a, b], { ...filters, category: 'cowork', comuna: 'Providencia', amenity: 'wifi', type: 'meeting_room' }), [a])
  assert.deepEqual(filterLocations([a, b], { ...filters, comuna: 'Las Condes' }), [])
  assert.deepEqual(filterLocations([a, b], { name: '', category: '', comuna: '', amenity: '', type: '' }), [a, b])
})

test('Vite endpoints enforce localhost, same origin and JSON, with actual HTTP CRUD', async (t) => {
  const f = fixture(t)
  const server = await createServer({ configFile: false, root: f.root, plugins: [adminPlugin()], server: { host: '127.0.0.1', port: 0 }, logLevel: 'silent' })
  t.after(async () => { await server.close() })
  await server.listen()
  const origin = `http://127.0.0.1:${server.httpServer.address().port}`
  const url = `${origin}/__admin/locations`
  const get = await fetch(url)
  assert.equal(get.status, 200)
  let state = await get.json()
  assert.deepEqual(state.locations, JSON.parse(original))
  const value = sample()
  const post = (body, headers = {}) => fetch(url, { method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body) })
  assert.equal((await post({}, { Origin: 'https://example.com' })).status, 403)
  assert.equal((await post({}, { 'Content-Type': 'text/plain' })).status, 403)
  const foreignHostStatus = await new Promise((resolve, reject) => {
    httpGet(url, { headers: { Host: 'example.com' } }, (response) => { response.resume(); resolve(response.statusCode) }).on('error', reject)
  })
  assert.equal(foreignHostStatus, 403)
  assert.equal((await fetch(`${origin}/admin`, { headers: { Origin: 'https://example.com' } })).status, 403)
  assert.equal((await fetch(url, { method: 'DELETE' })).status, 405)
  for (const action of ['create', 'update', 'delete']) {
    const response = await post({ action, location: value, id: value.id, revision: state.revision })
    assert.equal(response.status, 200, await response.clone().text())
    state = await response.json()
  }
  assert.deepEqual(state.locations, JSON.parse(original))
  assert.equal(adminPlugin().apply, 'serve')
  assert.equal(adminPlugin().configurePreviewServer, undefined)
  const html = '<script type="module" src="/src/main.tsx"></script>'
  assert.ok(adminPlugin().transformIndexHtml.handler(html, { originalUrl: '/admin?test=1' }).includes('/src/admin/main.tsx'))
  assert.equal(adminPlugin().transformIndexHtml.handler(html, { originalUrl: '/' }), html)
})
