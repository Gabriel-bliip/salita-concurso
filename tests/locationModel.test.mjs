import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { withLocation, normalizeLocation, serializeLocation, DEFAULT_LOCATION } from '../src/lib/location.ts'
import { AMENITIES, hasAmenity } from '../src/data/amenities.ts'

const records = JSON.parse(readFileSync(new URL('../src/data/locations.json', import.meta.url), 'utf8'))

test('normalization preserves all current identifiers, values and unknown properties', () => {
  for (const record of records) {
    const original = structuredClone(record)
    assert.deepEqual(withLocation(record), record)
    assert.deepEqual(serializeLocation(withLocation(record), record), record)
    assert.deepEqual(record, original)
  }
  const source = { ...records[0], custom: { verified: false } }
  const edited = { ...withLocation(source), name: 'Nombre editado' }
  assert.deepEqual(serializeLocation(edited, source), { ...source, name: edited.name })
})

test('legacy optional omissions normalize to empty arrays and closed days without mutating input', () => {
  const legacy = structuredClone(records[0])
  for (const key of ['categoryId', 'amenityIds', 'rules', 'images', 'photoCaptions', 'spaces', 'openingHours']) delete legacy[key]
  const original = structuredClone(legacy)
  const normalized = withLocation(legacy)
  assert.equal(normalized.categoryId, 'cowork')
  for (const key of ['amenityIds', 'rules', 'images', 'photoCaptions', 'spaces']) assert.deepEqual(normalized[key], [])
  assert.deepEqual(Object.values(normalized.openingHours), Array(7).fill(null))
  assert.deepEqual(serializeLocation(normalized, legacy), original)
  assert.deepEqual(legacy, original)
  assert.equal(normalized.attributes, undefined)
  assert.equal(normalized.contact, undefined)
})

test('normalization retains legacy position fallback and does not mask invalid write coordinates', () => {
  const legacy = { ...records[0], location: { latitude: 91, longitude: 0 } }
  assert.deepEqual(withLocation(legacy).location, DEFAULT_LOCATION.location)
  assert.equal(withLocation(legacy).address, DEFAULT_LOCATION.address)
  assert.equal(normalizeLocation(legacy).location.latitude, 91)
  const trimmed = { ...records[0], address: `  ${records[0].address}  ` }
  assert.equal(withLocation(trimmed).address, records[0].address)
  assert.deepEqual(serializeLocation(withLocation(trimmed), trimmed), trimmed)
})

test('absent amenities, including future registry additions, always mean false', () => {
  const source = { amenityIds: ['wifi'] }
  const before = JSON.stringify(source)
  assert.equal(hasAmenity(source, 'wifi'), true)
  for (const { id } of [...AMENITIES, { id: 'future-service', label: 'Nuevo' }]) {
    assert.equal(hasAmenity(source, id), id === 'wifi')
    assert.equal(hasAmenity({}, id), false)
  }
  assert.equal(JSON.stringify(source), before)
})

test('compact serialization omits only absent values and retains explicit attribute false', () => {
  const value = normalizeLocation({ ...records[0], amenityIds: [], rules: [], images: [], photoCaptions: [], spaces: [], contact: {}, attributes: { soundproof: false }, openingHours: { 1: { open: 9, close: 18 } } })
  const stored = JSON.parse(JSON.stringify(serializeLocation(value)))
  for (const key of ['amenityIds', 'rules', 'images', 'photoCaptions', 'spaces', 'contact']) assert.ok(!Object.hasOwn(stored, key))
  assert.deepEqual(stored.openingHours, { 1: { open: 9, close: 18 } })
  assert.equal(stored.attributes.soundproof, false)
  const expected = { ...value }
  delete expected.contact
  assert.deepEqual(normalizeLocation(stored), expected)
})
