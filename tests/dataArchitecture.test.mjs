import assert from 'node:assert/strict'
import test from 'node:test'
import { CATEGORIES, defineCategory } from '../src/data/categories.ts'
import { attributeFields, getFieldValue, setFieldValue, validateFields } from '../src/lib/fields.ts'
import { validateLocation } from '../src/lib/locationSchema.ts'
import { SPACE_DEFINITIONS, SPACE_TYPES, spaceFields } from '../src/data/spaceTypes.ts'
import { newLocation, newSpace } from '../src/admin/model.ts'
import { getCapacityRange } from '../src/lib/spaces.ts'
import { filterCoworks, EMPTY_FILTERS, parseFilters } from '../src/lib/coworkFilters.ts'
import { buildBooking, validatePeople } from '../src/lib/booking.ts'
import { getTimeSlots } from '../src/lib/availability.ts'

const sample = () => ({ ...newLocation(), name: 'Prueba', slug: 'prueba', address: 'Calle 123', description: 'Descripción' })

test('one category definition supplies attribute fields, validation and public filters', () => {
  const category = defineCategory({ id: 'test-dance', name: 'Danza', filters: { comuna: true }, attributes: [
    { id: 'area', label: 'Superficie', type: 'number', min: 1, integer: true, required: true },
    { id: 'quiet', label: 'Silencioso', type: 'boolean' },
    { id: 'equipment', label: 'Equipo', type: 'multiselect', required: true, filter: true, options: [{ value: 'mirrors', label: 'Espejos' }] },
  ] })
  const fields = attributeFields(category)
  assert.deepEqual(Object.keys(fields), ['area', 'quiet', 'equipment'])
  assert.deepEqual(category.filters.attributes, [{ id: 'equipment', label: 'Equipo', options: category.attributes[2].options }])
  const value = { ...sample(), categoryId: category.id, attributes: { area: 40, quiet: false, equipment: ['mirrors'] } }
  assert.doesNotThrow(() => validateLocation(value, [], [category]))
  for (const attributes of [{}, { ...value.attributes, area: -1 }, { ...value.attributes, area: 2.5 }, { ...value.attributes, equipment: ['unknown'] }, { ...value.attributes, quiet: 'yes' }]) {
    assert.throws(() => validateLocation({ ...value, attributes }, [], [category]))
  }
  const filters = parseFilters(new URLSearchParams('attribute.equipment=mirrors'), category, [value])
  assert.equal(filterCoworks([value], filters, category).length, 1)
  assert.equal(filterCoworks([{ ...value, attributes: {} }], filters, category).length, 0)
  assert.equal(filterCoworks([{ ...value, attributes: undefined }], EMPTY_FILTERS, category).length, 1)
  assert.ok(!CATEGORIES.some(({ id }) => id === category.id))
})

test('legacy filter-only attributes share the same field generation without duplicates', () => {
  const category = defineCategory({ id: 'test-legacy', name: 'Antigua', filters: { attributes: [{ id: 'equipment', label: 'Anterior', options: [{ value: 'old', label: 'Anterior' }] }] }, attributes: [{ id: 'equipment', label: 'Actual', type: 'select', filter: true, options: [{ value: 'new', label: 'Actual' }] }] })
  assert.equal(Object.keys(attributeFields(category)).length, 1)
  assert.equal(attributeFields(category).equipment.label, 'Actual')
  assert.equal(category.filters.attributes.length, 1)
  assert.equal(category.filters.attributes[0].options[0].value, 'new')
})

test('shared nested fields preserve IDs and extras, and reject invalid unit values', () => {
  for (const type of SPACE_TYPES) {
    const unit = { ...newSpace(type), name: 'Unidad', description: 'Descripción', pricePerHour: 5000, extra: { keep: true } }
    assert.doesNotThrow(() => validateFields(unit, spaceFields(type)))
    const changed = setFieldValue(unit, 'pricePerHour', 7000)
    assert.equal(changed.id, unit.id)
    assert.deepEqual(changed.extra, unit.extra)
    assert.equal(unit.pricePerHour, 5000)
    assert.throws(() => validateFields({ ...unit, pricePerHour: -1 }, spaceFields(type)), /Precio/)
    assert.deepEqual(getCapacityRange(unit), SPACE_DEFINITIONS[type].getCapacity(unit))
  }
  const room = newSpace('meeting_room')
  const changed = setFieldValue(room, 'capacity.max', 8)
  assert.equal(getFieldValue(changed, 'capacity.min'), 1)
  assert.equal(getFieldValue(changed, 'capacity.max'), 8)
  assert.equal(room.capacity.max, 2)
  assert.throws(() => setFieldValue({}, '__proto__.polluted', true), /inválido/)
})

test('registered units retain filters, capacity, prices, opening times and booking behavior', () => {
  for (const type of SPACE_TYPES) {
    const unit = { ...newSpace(type), name: 'Unidad', description: 'Descripción', pricePerHour: 5000 }
    const value = { ...sample(), spaces: [unit] }
    assert.doesNotThrow(() => validateLocation(value, []))
    const { min, max } = getCapacityRange(unit)
    assert.equal(validatePeople(unit, min), null)
    assert.ok(validatePeople(unit, max + 1))
    assert.equal(filterCoworks([value], { ...EMPTY_FILTERS, spaceType: type, people: max }).length, 1)
    assert.equal(filterCoworks([value], { ...EMPTY_FILTERS, people: max + 1 }).length, 0)
    const booking = buildBooking(value, { spaceId: unit.id, date: '2030-01-07', startHour: 9, endHour: 11, people: min })
    assert.ok(booking)
    assert.equal(booking.total, 10000)
    assert.equal(booking.spaceId, unit.id)
    const slots = getTimeSlots(value, unit, '2030-01-07', new Date('2030-01-01T12:00:00'))
    assert.equal(slots[0].start, 9)
    assert.equal(slots.at(-1).end, 18)
    assert.deepEqual(getTimeSlots(value, unit, '2030-01-06'), [])
  }
})
