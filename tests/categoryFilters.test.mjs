import assert from 'node:assert/strict'
import test from 'node:test'
import { CATEGORIES, COWORK_CATEGORY, getCategory } from '../src/data/categories.ts'
import { COMUNAS, COWORKS, LOCATIONS } from '../src/data/coworks.ts'
import { EMPTY_FILTERS, filterCoworks, filtersToParams, getCategoryComunas, parseFilters } from '../src/lib/coworkFilters.ts'
import { withLocation } from '../src/lib/location.ts'
import { MARKETPLACE_CATEGORIES } from '../src/data/marketplaceCategories.ts'

test('demo categories expose only coworks and meeting rooms without changing registry definitions', () => {
  assert.deepEqual(MARKETPLACE_CATEGORIES.map(({ id }) => id), ['cowork', 'sala-reuniones'])
  assert.deepEqual(MARKETPLACE_CATEGORIES.map(({ name }) => name), ['Coworks', 'Salas de reuniones'])
  for (const category of MARKETPLACE_CATEGORIES) {
    const original = getCategory(category.id)
    assert.equal(category.filters, original.filters)
    assert.deepEqual(
      filterCoworks(LOCATIONS, EMPTY_FILTERS, category),
      filterCoworks(LOCATIONS, EMPTY_FILTERS, original),
    )
  }
  const hiddenCategory = getCategory('taller-musica')
  assert.ok(hiddenCategory)
  assert.equal(MARKETPLACE_CATEGORIES.some(({ id }) => id === hiddenCategory.id), false)
  const fixture = { ...COWORKS[0], id: 'test-hidden', categoryId: hiddenCategory.id }
  assert.deepEqual(filterCoworks([fixture], EMPTY_FILTERS, hiddenCategory).map(({ cowork }) => cowork.id), ['test-hidden'])
})

test('locations retain valid categories and each category exposes only its own records', () => {
  assert.equal(new Set(CATEGORIES.map(({ id }) => id)).size, CATEGORIES.length)
  assert.ok(LOCATIONS.every(({ categoryId }) => getCategory(categoryId)))
  assert.deepEqual(filterCoworks(LOCATIONS, EMPTY_FILTERS).map(({ cowork }) => cowork), COWORKS)
  for (const category of CATEGORIES.filter(({ id }) => id !== 'cowork')) {
    const expected = LOCATIONS.filter(({ categoryId }) => categoryId === category.id)
    assert.deepEqual(filterCoworks(LOCATIONS, EMPTY_FILTERS, category).map(({ cowork }) => cowork), expected)
    assert.deepEqual(getCategoryComunas(category), [...new Set(expected.map(({ comuna }) => comuna))])
  }
  assert.equal(getCategory('unknown'), undefined)
})

test('legacy inputs without categoryId default to cowork and preserve valid coordinates', () => {
  const legacy = { ...COWORKS[0] }
  delete legacy.categoryId
  assert.deepEqual(withLocation(legacy), COWORKS[0])
})

test('Cowork retains combined space, people, comuna and service filters', () => {
  // Fixed demonstration records keep regression expectations stable as users add locations.
  const samples = COWORKS.filter(({ id }) => /^cw-[1-9]$/.test(id))
  const cases = [
    ['type=coworking&people=2', []],
    ['type=meeting_room&people=12', ['torre-pocuro', 'distrito-golf']],
    ['comuna=Providencia&amenities=parking', ['torre-pocuro']],
    ['type=office_box&people=6', ['nodo-moneda', 'distrito-golf']],
  ]
  for (const [query, expected] of cases) {
    const results = filterCoworks(samples, parseFilters(new URLSearchParams(query)))
    assert.deepEqual(results.map(({ cowork }) => cowork.slug), expected)
  }
  const results = filterCoworks(LOCATIONS, parseFilters(new URLSearchParams('type=meeting_room&people=12')))
  assert.ok(results.every(({ spaces }) => spaces.every((space) => space.type === 'meeting_room' && space.capacity.max >= 12)))
})

test('only the selected category contributes results and comuna options, even with no bookable spaces', () => {
  const category = getCategory('taller-musica')
  const venue = { ...COWORKS[0], id: 'test-music', categoryId: category.id, spaces: [] }
  const source = [...COWORKS, venue]
  assert.deepEqual(filterCoworks(source, EMPTY_FILTERS, category).map(({ cowork }) => cowork.id), ['test-music'])
  assert.deepEqual(getCategoryComunas(category, source), [venue.comuna])
  assert.equal(filterCoworks(source, EMPTY_FILTERS, COWORK_CATEGORY).length, COWORKS.length)
})

test('URL filters unsupported by a category cannot hide its locations', () => {
  const category = getCategory('taller-musica')
  const venue = { ...COWORKS[0], categoryId: category.id, spaces: [] }
  const filters = parseFilters(new URLSearchParams('type=office_box&people=100&amenities=parking&attribute.fake=yes'), category, [venue])
  assert.equal(filtersToParams(filters).size, 0)
  assert.equal(filterCoworks([venue], { ...EMPTY_FILTERS, people: 100, amenityIds: ['parking'] }, category).length, 1)
})

test('configured attributes filter real values, require all selections and survive a URL round trip', () => {
  const category = {
    ...getCategory('taller-musica'),
    filters: { attributes: [{ id: 'equipment', label: 'Equipment', options: [
      { value: 'piano', label: 'Piano' }, { value: 'drums', label: 'Drums' },
    ] }] },
  }
  // Fixtures belong only to this test; no example locations are added to the catalog.
  const source = [
    { ...COWORKS[0], id: 'both', categoryId: category.id, attributes: { equipment: ['piano', 'drums'] } },
    { ...COWORKS[0], id: 'one', categoryId: category.id, attributes: { equipment: 'piano' } },
    { ...COWORKS[0], id: 'missing', categoryId: category.id },
  ]
  const filters = parseFilters(new URLSearchParams('attribute.equipment=piano&attribute.equipment=drums&attribute.equipment=unknown'), category, source)
  assert.deepEqual(filterCoworks(source, filters, category).map(({ cowork }) => cowork.id), ['both'])
  assert.deepEqual(parseFilters(filtersToParams(filters), category, source), filters)
  const single = parseFilters(new URLSearchParams('attribute.equipment=piano'), category, source)
  assert.deepEqual(filterCoworks(source, single, category).map(({ cowork }) => cowork.id), ['both', 'one'])
})

test('unknown URL values are ignored and arbitrary positive legacy people counts are preserved', () => {
  const filters = parseFilters(new URLSearchParams('type=invalid&people=-1&comuna=invalid&amenities=invalid'))
  assert.equal(filtersToParams(filters).size, 0)
  const valid = parseFilters(new URLSearchParams('type=meeting_room&people=3&comuna=Providencia&amenities=wifi,parking'))
  assert.equal(valid.people, 3)
  assert.deepEqual(parseFilters(filtersToParams(valid)), valid)
})

test('new commune listings produce unique category options without changing the catalog', () => {
  const category = getCategory('taller-musica')
  const source = [
    { ...COWORKS[0], id: 'cowork-buin', comuna: 'Buin' },
    { ...COWORKS[0], id: 'music-buin', categoryId: category.id, comuna: 'Buin', spaces: [] },
    { ...COWORKS[0], id: 'music-buin-2', categoryId: category.id, comuna: 'Buin', spaces: [] },
    { ...COWORKS[0], id: 'music-paine', categoryId: category.id, comuna: 'Paine', spaces: [] },
  ]
  const original = structuredClone(source)
  assert.deepEqual(getCategoryComunas(COWORK_CATEGORY, source), ['Buin'])
  assert.deepEqual(getCategoryComunas(category, source), ['Buin', 'Paine'])
  assert.deepEqual(getCategoryComunas(category, []), [])
  const filters = parseFilters(new URLSearchParams('comuna=Buin'), category, source)
  assert.equal(filters.comuna, 'Buin')
  assert.deepEqual(parseFilters(filtersToParams(filters), category, source), filters)
  assert.deepEqual(filterCoworks(source, filters, category).map(({ cowork }) => cowork.id), ['music-buin', 'music-buin-2'])
  assert.equal(parseFilters(new URLSearchParams('comuna=Paine'), COWORK_CATEGORY, source).comuna, null)
  const noCommuneFilter = { ...category, filters: {} }
  assert.equal(parseFilters(new URLSearchParams('comuna=Buin'), noCommuneFilter, source).comuna, null)
  assert.deepEqual(COMUNAS, getCategoryComunas(COWORK_CATEGORY))
  assert.equal(new Set(COMUNAS).size, COMUNAS.length)
  assert.deepEqual(source, original)
})
