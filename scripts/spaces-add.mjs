import { createInterface } from 'node:readline'
import { randomUUID } from 'node:crypto'
import { readFileSync, openSync, writeFileSync, fsyncSync, closeSync, renameSync, unlinkSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { CATEGORIES } from '../src/data/categories.ts'
import { AMENITIES } from '../src/data/amenities.ts'
import { SPACE_TYPES, SPACE_TYPE_LABELS, EQUIPMENT_LABELS, getCapacityRange } from '../src/lib/spaces.ts'
import { SPACE_DEFINITIONS, SPACE_FIELDS as spaceFields } from '../src/data/spaceTypes.ts'
import { option, text, number, choice, setFieldValue } from '../src/lib/fields.ts'
import { commonFields, contactFields, amenities, photo, normalizeName as normalize, attributeFields, validateValue, validateLocation } from '../src/lib/locationSchema.ts'
import { normalizeLocation, serializeLocation } from '../src/lib/location.ts'
export { attributeFields, validateValue, validateLocation } from '../src/lib/locationSchema.ts'

export const DATA_FILE = fileURLToPath(new URL('../src/data/locations.json', import.meta.url))
export class Cancelled extends Error {}

export function parseAnswer(raw, field) {
  const input = raw.trim()
  let value = input || undefined
  if (input) {
    if (field.type === 'number') value = /^-?\d+(\.\d+)?$/.test(input) ? Number(input) : NaN
    if (field.type === 'boolean') value = /^(s[ií]?|yes|y)$/i.test(input) ? true : /^(no?|n)$/i.test(input) ? false : input
    if (field.type === 'select' || field.type === 'multiselect') {
      const resolve = (entry) => {
        const index = /^\d+$/.test(entry) ? Number(entry) - 1 : -1
        return field.options[index]?.value ?? field.options.find(({ value }) => value === entry)?.value
      }
      value = field.type === 'multiselect' ? [...new Set(input.split(',').map((entry) => resolve(entry.trim())))] : resolve(input)
      if (value === undefined || (Array.isArray(value) && value.includes(undefined))) throw new Error('Elige los números de la lista; separa varias opciones con comas.')
    }
  }
  validateValue(value, field)
  return value
}

async function askField(ask, output, field) {
  if (field.options) output(field.options.map(({ label }, i) => `  ${i + 1}. ${label}`).join('\n'))
  while (true) {
    const answer = await ask(`${field.label} (${field.required ? 'obligatorio' : 'opcional; Enter para omitir'})${field.example ? ` — ${field.example}` : ''}${field.type === 'multiselect' ? ' [números separados por comas]' : ''}: `)
    if (answer.trim().toLowerCase() === ':cancelar') throw new Cancelled()
    try { return parseAnswer(answer, field) }
    catch (error) { output(`  ${error.message}`) }
  }
}

function uniqueSlug(name, entries) {
  const base = normalize(name).replace(/ /g, '-') || 'ubicacion'
  let slug = base
  for (let suffix = 2; entries.some((entry) => entry.slug === slug); suffix++) slug = `${base}-${suffix}`
  return slug
}

// Lock only while committing. Recheck the original bytes to avoid lost updates.
// Temp file and destination share a directory/filesystem; rename commits atomically.
export function saveLocation(file, original, location, categories = CATEGORIES) {
  const lock = `${file}.lock`
  const temporary = `${file}.${randomUUID()}.tmp`
  let lockFd
  let tempFd
  try {
    try { lockFd = openSync(lock, 'wx') }
    catch (error) {
      if (error.code === 'EEXIST') throw new Error('Otro asistente está guardando. Intenta nuevamente; si quedó un .lock tras un cierre forzado, comprueba que no haya otro asistente antes de borrarlo.', { cause: error })
      throw error
    }
    if (readFileSync(file, 'utf8') !== original) throw new Error('Los datos cambiaron mientras respondías. Reinicia el asistente para conservar ambos cambios.')
    const entries = JSON.parse(original)
    validateLocation(location, entries, categories)
    tempFd = openSync(temporary, 'wx')
    writeFileSync(tempFd, JSON.stringify([...entries, serializeLocation(normalizeLocation(location))], null, 2) + '\n')
    fsyncSync(tempFd)
    closeSync(tempFd)
    tempFd = undefined
    renameSync(temporary, file)
  } finally {
    if (tempFd !== undefined) closeSync(tempFd)
    try { removeTemporary(temporary) }
    finally { if (lockFd !== undefined) { closeSync(lockFd); unlinkSync(lock) } }
  }
}

function removeTemporary(file) {
  try { unlinkSync(file) } catch (error) { if (error.code !== 'ENOENT') throw error }
}

export async function runWizard({ ask, output = console.log, file = DATA_FILE, categories = CATEGORIES }) {
  const original = readFileSync(file, 'utf8')
  const entries = JSON.parse(original)
  if (!Array.isArray(entries)) throw new Error('La fuente de ubicaciones debe contener una lista JSON.')
  output('\nAgregar una ubicación — escribe :cancelar o presiona Ctrl+C para salir sin guardar.\n')
  const field = (definition) => askField(ask, output, definition)
  const fields = async (definitions) => {
    let values = {}
    for (const [key, definition] of Object.entries(definitions)) {
      const value = await field(definition)
      if (value !== undefined) values = setFieldValue(values, key, value)
    }
    return values
  }
  const yes = async (label) => (await field({ label: `${label} [sí/no]`, type: 'boolean' })) === true
  const categoryId = await field(choice('Categoría', categories.map(({ id, name }) => option(id, name))))
  const category = categories.find(({ id }) => id === categoryId)
  const location = { id: `loc-${randomUUID()}`, categoryId, ...await fields(commonFields) }
  location.slug = uniqueSlug(location.name, entries)
  location.location = await fields({ latitude: { ...number('Latitud', -90, 90, false), example: '-33.42 (usa punto decimal)' }, longitude: { ...number('Longitud', -180, 180, false), example: '-70.60' } })
  const contact = await fields(contactFields)
  if (Object.keys(contact).length) location.contact = contact
  const attributes = await fields(attributeFields(category))
  if (Object.keys(attributes).length) location.attributes = attributes
  location.amenityIds = await field(amenities) ?? []
  location.openingHours = {}
  for (const [day, label] of ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'].entries()) {
    while (true) {
      const raw = await ask(`${label}: horario en horas enteras (ej. 9-18); Enter = cerrado: `)
      if (raw.trim().toLowerCase() === ':cancelar') throw new Cancelled()
      if (!raw.trim()) { location.openingHours[day] = null; break }
      const match = /^(\d{1,2})-(\d{1,2})$/.exec(raw.trim())
      if (match && +match[1] < +match[2] && +match[2] <= 24) {
        location.openingHours[day] = { open: +match[1], close: +match[2] }; break
      }
      output('Usa apertura-cierre entre 0 y 24, con cierre posterior; por ejemplo 9-18.')
    }
  }
  location.rules = []
  while (true) {
    const rule = await field(text('Regla del lugar (una por vez)', false))
    if (!rule) break
    location.rules.push(rule)
  }
  location.images = []
  location.photoCaptions = []
  while (await yes('¿Agregar una foto?')) {
    location.images.push(await field(photo))
    location.photoCaptions.push(await field(text('Descripción de la foto')))
  }
  location.spaces = []
  while (await yes('¿Agregar un espacio reservable?')) {
    const type = await field(choice('Tipo de espacio', SPACE_TYPES.map((type) => option(type, SPACE_TYPE_LABELS[type]))))
    const space = { id: `space-${randomUUID()}`, type, ...await fields(spaceFields) }
    while (!Object.values(location.openingHours).some((hours) => hours && hours.close - hours.open >= space.minHours)) {
      if (!Object.values(location.openingHours).some(Boolean)) throw new Error('Para agregar reservas, indica al menos un día abierto. Reinicia el asistente con horarios; no se guardó nada.')
      output('El mínimo de reserva debe caber en al menos un día abierto.')
      space.minHours = await field(spaceFields.minHours)
    }
    Object.assign(space, structuredClone(SPACE_DEFINITIONS[type].defaults), await fields(SPACE_DEFINITIONS[type].fields))
    while (getCapacityRange(space).max < getCapacityRange(space).min) {
      output('La capacidad máxima debe ser mayor o igual a la mínima.')
      Object.assign(space, setFieldValue(space, 'capacity.max', await field(SPACE_DEFINITIONS[type].fields['capacity.max'])))
    }
    location.spaces.push(space)
  }
  validateLocation(location, entries, categories)
  const lines = [
    `\nResumen — ${category.name}`,
    `Nombre: ${location.name}`, `Descripción: ${location.description}`,
    `Dirección: ${location.address} (${location.comuna})`,
    `Coordenadas: ${location.location.latitude}, ${location.location.longitude}`,
    ...Object.entries(contact).map(([key, value]) => `${contactFields[key].label}: ${value}`),
    ...Object.entries(attributes).map(([key, value]) => {
      const definition = attributeFields(category)[key]
      const label = (item) => definition.options?.find(({ value }) => value === item)?.label ?? (typeof item === 'boolean' ? (item ? 'Sí' : 'No') : item)
      return `${definition.label}: ${Array.isArray(value) ? value.map(label).join(', ') : label(value)}`
    }),
    `Servicios: ${location.amenityIds.map((id) => AMENITIES.find((item) => item.id === id).label).join(', ') || 'Sin servicios indicados'}`,
    ...['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'].map((day, index) => {
      const hours = location.openingHours[index]
      return `${day}: ${hours ? `${hours.open}:00–${hours.close}:00` : 'Cerrado'}`
    }),
    `Reglas: ${location.rules.join('; ') || 'Sin reglas indicadas'}`,
    `Fotos: ${location.images.map((image, index) => `${image} (${location.photoCaptions[index]})`).join('; ') || 'Sin fotos'}`,
    `Espacios reservables: ${location.spaces.length}`,
    ...location.spaces.map((space) => `${space.name} — ${SPACE_TYPE_LABELS[space.type]}\n  ${space.description}\n  ${space.pricePerHour} CLP/h; mínimo ${space.minHours} h; capacidad ${space.type === 'meeting_room' ? `${space.capacity.min}–${space.capacity.max}` : space.capacity}${space.type === 'coworking' ? `; ${space.deskCount} escritorios` : ''}${space.equipment ? `; equipo: ${space.equipment.map((id) => EQUIPMENT_LABELS[id]).join(', ') || 'ninguno'}` : ''}\n  ID: ${space.id}`),
    `ID: ${location.id}`, `Ficha: /ubicaciones/${location.slug}`, `Destino: ${file}\n`,
  ]
  output(lines.join('\n'))
  if (!await yes('¿Guardar esta ubicación?')) throw new Cancelled()
  saveLocation(file, original, location, categories)
  output(`Guardado: ${location.name}\nFicha: /ubicaciones/${location.slug}\nRevisa el cambio con git diff antes de publicarlo.`)
  return location
}

async function main() {
  const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: Boolean(process.stdin.isTTY) })
  const lines = rl[Symbol.asyncIterator]()
  let cancelled = false
  const cancel = () => { cancelled = true; rl.close() }
  rl.on('SIGINT', cancel)
  process.once('SIGTERM', cancel)
  try {
    await runWizard({ ask: async (prompt) => {
      process.stdout.write(prompt)
      if (cancelled) throw new Cancelled()
      const result = await lines.next()
      if (cancelled || result.done) throw new Cancelled()
      return result.value
    } })
  } catch (error) {
    if (error instanceof Cancelled) console.log('\nCancelado. No se modificaron datos.')
    else { console.error(`\nNo se pudo guardar: ${error.message}`); process.exitCode = 1 }
  } finally { rl.close(); process.removeListener('SIGTERM', cancel) }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main()
