import assert from 'node:assert/strict'
import { test } from 'node:test'
import { mkdtempSync, readFileSync, writeFileSync, rmSync, readdirSync, mkdirSync, copyFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { spawnSync, spawn } from 'node:child_process'
import { once } from 'node:events'
import { pathToFileURL } from 'node:url'
import { runWizard, saveLocation, validateLocation, parseAnswer, Cancelled, DATA_FILE } from '../scripts/spaces-add.mjs'
import { CATEGORIES } from '../src/data/categories.ts'
import { LOCATIONS, COWORKS } from '../src/data/coworks.ts'
import { filterCoworks, EMPTY_FILTERS, parseFilters } from '../src/lib/coworkFilters.ts'
import { normalizeLocation } from '../src/lib/location.ts'

const original = readFileSync(DATA_FILE, 'utf8')
const minimal = (name = 'Prueba temporal') => [
  '2', name, 'Descripción del taller', 'Calle de prueba 123, Providencia', '2', '-33.42', '-70.60',
  '', '', '', // Contact optional
  '', // Amenities
  '', '9-18', '9-18', '9-18', '9-18', '9-18', '',
  '', '', '', // No rules, photos or bookable spaces
]

function fixture(t) {
  const dir = mkdtempSync(join(tmpdir(), 'salita-spaces-'))
  t.after(() => rmSync(dir, { recursive: true, force: true }))
  const file = join(dir, 'locations.json')
  writeFileSync(file, original)
  return { dir, file }
}

function input(answers) {
  let index = 0
  return async (prompt) => {
    assert.ok(index < answers.length, `Faltan respuestas para ${prompt}`)
    return answers[index++]
  }
}

test('complete wizard persists a location, contact, photos, all reservable types and category attributes', async (t) => {
  const { file } = fixture(t)
  const category = {
    ...CATEGORIES[1],
    attributes: [
      { id: 'instruments', label: 'Instrumentos', type: 'multiselect', required: true, options: [{ value: 'piano', label: 'Piano' }], filter: true },
      { id: 'area', label: 'Superficie', type: 'number', min: 1, required: true },
      { id: 'accessible', label: 'Accesible', type: 'boolean' },
      { id: 'notes', label: 'Notas', type: 'text' },
      { id: 'optional', label: 'Opcional', type: 'text' },
    ],
    filters: { attributes: [{ id: 'instruments', label: 'Instrumentos', options: [{ value: 'piano', label: 'Piano' }] }] },
  }
  const answers = [
    '1', 'Taller temporal', 'Descripción', 'Calle 123', '2', '-91', '-33.42', '-70.60',
    'incorrecto', 'contacto@ejemplo.cl', '+56 9 1234 5678', 'https://ejemplo.cl',
    '', '1', '0', '42.5', 'sí', 'Nota', '', '1,2',
    '', '18-9', '9-18', '9-18', '9-18', '9-18', '9-18', '',
    'Respetar horarios', '', 'sí', '/images/prueba.jpg', 'Interior', 'no',
    'sí', '1', 'Escritorio', 'Zona común', '4000', '1', '12',
    'sí', '2', 'Sala', 'Sala principal', '10000', '1', '2', '1', '1,2', '6',
    'sí', '3', 'Oficina', 'Oficina privada', '8000', '2', '4',
    'no', 'sí',
  ]
  const messages = []
  const result = await runWizard({ file, categories: [category], ask: input(answers), output: (message) => messages.push(message) })
  const persisted = JSON.parse(readFileSync(file, 'utf8'))
  assert.deepEqual(persisted.slice(0, -1), LOCATIONS)
  assert.deepEqual(normalizeLocation(persisted.at(-1)), result)
  assert.deepEqual(result.attributes, { instruments: ['piano'], area: 42.5, accessible: true, notes: 'Nota' })
  assert.equal(result.contact.email, 'contacto@ejemplo.cl')
  assert.deepEqual(result.spaces.map(({ capacity }) => capacity), [1, { min: 2, max: 6 }, 4])
  assert.ok(messages.some((message) => message.includes('Resumen')))
  assert.ok(messages.some((message) => message.includes('obligatorio')))
  const filters = parseFilters(new URLSearchParams('attribute.instruments=piano'), category, persisted)
  assert.deepEqual(filterCoworks(persisted, filters, category).map(({ cowork }) => cowork.id), [result.id])
  assert.deepEqual(result.location, { latitude: -33.42, longitude: -70.60 })
})

test('cancellation at a prompt or at confirmation leaves bytes unchanged', async (t) => {
  const { dir, file } = fixture(t)
  for (const answers of [[':cancelar'], [...minimal(), 'no'], [...minimal(), '']]) {
    await assert.rejects(runWizard({ file, ask: input(answers), output() {} }), Cancelled)
    assert.equal(readFileSync(file, 'utf8'), original)
    assert.deepEqual(readdirSync(dir), ['locations.json'])
  }
})

test('duplicates, conflicting saves, locks and invalid data never change the source', async (t) => {
  const { dir, file } = fixture(t)
  const result = await runWizard({ file, ask: input([...minimal(), 'sí']), output() {} })
  const saved = readFileSync(file, 'utf8')
  const duplicate = { ...result, id: 'another-id', slug: 'another-slug', name: ' PRUEBA   TEMPORAL ' }
  assert.throws(() => saveLocation(file, saved, duplicate), /nombre y dirección/)
  assert.throws(() => saveLocation(file, original, result), /cambiaron/)
  const other = { ...result, id: 'new-id', slug: 'new-slug', name: 'Otro' }
  writeFileSync(`${file}.lock`, '')
  assert.throws(() => saveLocation(file, saved, other), /Otro asistente/)
  rmSync(`${file}.lock`)
  assert.throws(() => saveLocation(file, saved, { ...other, location: { latitude: 91, longitude: 0 } }), /Latitud/)
  assert.equal(readFileSync(file, 'utf8'), saved)
  assert.deepEqual(readdirSync(dir), ['locations.json'])
})

test('slug collisions get suffixes and UUIDs remain unique', async (t) => {
  const { file } = fixture(t)
  const answers = [...minimal(LOCATIONS[0].name), 'sí']
  const result = await runWizard({ file, ask: input(answers), output() {} })
  assert.equal(result.slug, `${LOCATIONS[0].slug}-2`)
  assert.ok(!LOCATIONS.some(({ id }) => id === result.id))
})

test('formats, required fields, choices and numeric bounds reject invalid input', () => {
  for (const [raw, field] of [
    ['', { type: 'text', required: true }],
    ['Infinity', { type: 'number' }], ['1e3', { type: 'number' }],
    ['2.5', { type: 'number', integer: true }], ['5', { type: 'number', max: 4 }],
    ['quizás', { type: 'boolean' }],
    ['0', { type: 'select', options: [{ value: 'a' }] }],
    ['1,9', { type: 'multiselect', options: [{ value: 'a' }] }],
    ['javascript:alert(1)', { type: 'text', format: 'url' }],
    ['//evil.example/a', { type: 'text', format: 'image' }],
    ['abc', { type: 'text', format: 'phone' }],
  ]) assert.throws(() => parseAnswer(raw, field))
  assert.equal(parseAnswer('no', { type: 'boolean' }), false)
  assert.equal(parseAnswer('', { type: 'number' }), undefined)
  assert.equal(parseAnswer('0', { type: 'number', min: 0 }), 0)
})

test('existing data validates, retaining filters and reservations after migration', () => {
  const legacyCategories = CATEGORIES.map((category) => ({ ...category, attributes: category.attributes?.map((field) => ({ ...field, required: false })) }))
  for (const location of LOCATIONS) {
    // Legacy captions can describe placeholder slots even without photos.
    validateLocation({ ...location, photoCaptions: location.images.length ? location.photoCaptions : [] }, LOCATIONS.filter(({ id }) => id !== location.id), legacyCategories)
  }
  assert.equal(filterCoworks(LOCATIONS, EMPTY_FILTERS).length, COWORKS.length)
})

function cliFixture(t) {
  const { dir } = fixture(t)
  for (const relative of ['scripts/spaces-add.mjs', 'src/data/categories.ts', 'src/data/amenities.ts', 'src/data/spaceTypes.ts', 'src/data/locations.json', 'src/types/index.ts', 'src/admin/model.ts', 'src/lib/spaces.ts', 'src/lib/fields.ts', 'src/lib/location.ts', 'src/lib/locationSchema.ts', 'package.json']) {
    const target = join(dir, relative)
    mkdirSync(dirname(target), { recursive: true })
    copyFileSync(new URL(`../${relative}`, import.meta.url), target)
  }
  return { dir, file: join(dir, 'src/data/locations.json'), script: join(dir, 'scripts/spaces-add.mjs') }
}

test('a category added only in the registry supplies both terminal questions and web filters', (t) => {
  const { dir, file, script } = cliFixture(t)
  const registry = join(dir, 'src/data/categories.ts')
  const definition = {
    id: 'test-new-category', name: 'Nueva categoría', filters: { comuna: true },
    attributes: [{ id: 'equipment', label: 'Equipo', type: 'select', required: true, filter: true, options: [{ value: 'piano', label: 'Piano' }] }],
  }
  writeFileSync(registry, readFileSync(registry, 'utf8').replace('const definitions = [', `const definitions = [\n${JSON.stringify(definition)},`))
  const answers = minimal()
  answers[0] = '1'
  answers.splice(10, 0, '1')
  const child = spawnSync(process.execPath, [script], { cwd: dir, input: [...answers, 'sí'].join('\n') + '\n', encoding: 'utf8', timeout: 10000 })
  assert.equal(child.status, 0, child.stderr)
  assert.equal(JSON.parse(readFileSync(file, 'utf8')).at(-1).attributes.equipment, 'piano')
  const inspect = spawnSync(process.execPath, ['--input-type=module', '-e', `import { CATEGORIES } from ${JSON.stringify(pathToFileURL(registry).href)}; console.log(JSON.stringify(CATEGORIES[0].filters.attributes))`], { encoding: 'utf8', timeout: 10000 })
  assert.equal(inspect.status, 0, inspect.stderr)
  assert.deepEqual(JSON.parse(inspect.stdout), [{ id: 'equipment', label: 'Equipo', options: definition.attributes[0].options }])
})

test('real terminal entrypoint handles piped input, EOF and confirmation', (t) => {
  const { dir, file, script } = cliFixture(t)
  for (const answers of [[], ['2'], [...minimal(), 'no']]) {
    const child = spawnSync(process.execPath, [script], { cwd: dir, input: answers.join('\n') + '\n', encoding: 'utf8', timeout: 10000 })
    assert.equal(child.status, 0, child.stderr)
    assert.match(child.stdout, /Cancelado/)
    assert.equal(readFileSync(file, 'utf8'), original)
  }
  const child = spawnSync(process.execPath, [script], { cwd: dir, input: [...minimal(), 'sí'].join('\n') + '\n', encoding: 'utf8', timeout: 10000 })
  assert.equal(child.status, 0, child.stderr)
  assert.match(child.stdout, /Guardado: Prueba temporal/)
  assert.equal(JSON.parse(readFileSync(file, 'utf8')).at(-1).name, 'Prueba temporal')
})

test('an amenity added only to the catalog is offered and validated without changing old records', (t) => {
  const { dir, file, script } = cliFixture(t)
  const registry = join(dir, 'src/data/amenities.ts')
  writeFileSync(registry, readFileSync(registry, 'utf8').replace('] as const', "  { id: 'test-shower', label: 'Ducha de prueba' },\n] as const"))
  const answers = minimal()
  answers[10] = '10'
  const child = spawnSync(process.execPath, [script], { cwd: dir, input: [...answers, 'sí'].join('\n') + '\n', encoding: 'utf8', timeout: 10000 })
  assert.equal(child.status, 0, child.stderr)
  const persisted = JSON.parse(readFileSync(file, 'utf8'))
  assert.deepEqual(persisted.at(-1).amenityIds, ['test-shower'])
  assert.deepEqual(persisted.slice(0, -1), JSON.parse(original))
  assert.match(child.stdout, /Ducha de prueba/)
})

test('a unit type registered in one file automatically supplies wizard fields, defaults and capacity', (t) => {
  const { dir, file, script } = cliFixture(t)
  const registry = join(dir, 'src/data/spaceTypes.ts')
  const definition = `test_unit: {
    label: 'Unidad de prueba', plural: 'Unidades de prueba', icon: 'room', takenPercent: 0,
    defaults: { capacity: 4 }, fields: { capacity: number('Capacidad de prueba', 1, 10) },
    getCapacity: (space: { capacity: number }) => ({ min: 1, max: space.capacity }),
  },`
  writeFileSync(registry, readFileSync(registry, 'utf8').replace('export const SPACE_DEFINITIONS = {', `export const SPACE_DEFINITIONS = {\n${definition}`))
  const answers = minimal()
  answers[answers.length - 1] = 'sí'
  // The fixture inserts its type first; all subsequent prompts use the registry.
  answers.push('1', 'Unidad', 'Descripción', '1000', '1', '4', 'no', 'sí')
  const child = spawnSync(process.execPath, [script], { cwd: dir, input: answers.join('\n') + '\n', encoding: 'utf8', timeout: 10000 })
  assert.equal(child.status, 0, child.stderr)
  const persisted = JSON.parse(readFileSync(file, 'utf8'))
  assert.equal(persisted.at(-1).spaces[0].type, 'test_unit')
  assert.equal(persisted.at(-1).spaces[0].capacity, 4)
  assert.deepEqual(persisted.slice(0, -1), JSON.parse(original))
  const model = pathToFileURL(join(dir, 'src/admin/model.ts')).href
  const inspect = spawnSync(process.execPath, ['--input-type=module', '-e', `import { newSpace } from ${JSON.stringify(model)}; console.log(JSON.stringify(newSpace('test_unit')))`], { encoding: 'utf8', timeout: 10000 })
  assert.equal(inspect.status, 0, inspect.stderr)
  assert.equal(JSON.parse(inspect.stdout).capacity, 4)
})

test('interrupting the real process before confirmation preserves source bytes', { timeout: 10000 }, async (t) => {
  const { dir, file, script } = cliFixture(t)
  const child = spawn(process.execPath, [script], { cwd: dir, stdio: ['pipe', 'pipe', 'pipe'] })
  t.after(() => child.kill())
  const exit = once(child, 'exit')
  await Promise.race([once(child.stdout, 'data'), exit.then(() => { throw new Error('El asistente terminó antes de mostrar preguntas.') })])
  child.kill('SIGINT')
  await exit
  assert.equal(readFileSync(file, 'utf8'), original)
})
