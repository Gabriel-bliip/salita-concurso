import { createInterface } from 'node:readline'
import { randomUUID } from 'node:crypto'
import { readFileSync, openSync, writeFileSync, fsyncSync, closeSync, renameSync, unlinkSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { CATEGORIES } from '../src/data/categories.ts'
import { COMUNA_OPTIONS } from '../src/types/index.ts'
import { AMENITIES } from '../src/data/amenities.ts'
import { SPACE_TYPES, SPACE_TYPE_LABELS, EQUIPMENT_LABELS } from '../src/lib/spaces.ts'

export const DATA_FILE = fileURLToPath(new URL('../src/data/locations.json', import.meta.url))
const option = (value, label = value) => ({ value, label })
const text = (label, required = true, extra = {}) => ({ label, type: 'text', required, ...extra })
const number = (label, min, max, integer = true) => ({ label, type: 'number', required: true, min, max, integer })
const choice = (label, options, required = true, multiple = false) => ({ label, type: multiple ? 'multiselect' : 'select', options, required })
const commonFields = {
  name: text('Nombre del lugar'),
  description: text('Descripción del lugar'),
  address: text('Dirección completa', true, { example: 'Calle, número, piso, comuna y ciudad' }),
  comuna: choice('Comuna', COMUNA_OPTIONS.map((value) => option(value))),
}
const contactFields = {
  email: text('Correo de contacto', false, { format: 'email', example: 'reservas@ejemplo.cl' }),
  phone: text('Teléfono de contacto', false, { format: 'phone', example: '+56 9 1234 5678' }),
  website: text('Sitio web', false, { format: 'url', example: 'https://ejemplo.cl' }),
}
const spaceFields = {
  name: text('Nombre del espacio reservable'),
  description: text('Descripción del espacio reservable'),
  pricePerHour: number('Precio por hora (CLP)', 0, Number.MAX_SAFE_INTEGER),
  minHours: number('Mínimo de horas por reserva', 1, 24),
}
const equipment = choice('Equipamiento', Object.entries(EQUIPMENT_LABELS).map(([id, label]) => option(id, label)), false, true)
const spaceSpecific = {
  coworking: { deskCount: number('Cantidad de escritorios', 1, Number.MAX_SAFE_INTEGER) },
  meeting_room: { min: number('Capacidad mínima', 1, Number.MAX_SAFE_INTEGER), max: number('Capacidad máxima', 1, Number.MAX_SAFE_INTEGER), equipment },
  office_box: { capacity: number('Capacidad de la oficina', 2, 6) },
}
const amenities = choice('Servicios disponibles', AMENITIES.map(({ id, label }) => option(id, label)), false, true)
const photo = text('Ruta pública o URL de la foto', true, { format: 'image', example: '/images/sala.jpg o https://ejemplo.cl/sala.jpg' })
const normalize = (value) => value.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()

export class Cancelled extends Error {}

// The same category definitions supply the terminal fields and the web filters.
export function attributeFields(category) {
  return Object.fromEntries([
    ...(category.filters.attributes ?? []).filter((field) => !category.attributes?.some(({ id }) => id === field.id))
      .map((field) => [field.id, { ...field, type: 'multiselect' }]),
    ...(category.attributes ?? []).map((field) => [field.id, field]),
  ])
}

export function validateValue(value, field) {
  if (value === undefined || (Array.isArray(value) && !value.length)) {
    if (field.required) throw new Error('Este campo es obligatorio.')
    return
  }
  if (field.type === 'number') {
    if (!Number.isFinite(value) || (field.integer && !Number.isSafeInteger(value)) ||
        value < (field.min ?? -Infinity) || value > (field.max ?? Infinity)) {
      throw new Error(`Ingresa un número ${field.integer ? 'entero ' : ''}entre ${field.min ?? '-∞'} y ${field.max ?? '∞'}.`)
    }
  } else if (field.type === 'boolean') {
    if (typeof value !== 'boolean') throw new Error('Responde sí o no.')
  } else if (field.type === 'select' || field.type === 'multiselect') {
    const values = field.type === 'multiselect' ? value : [value]
    if (!Array.isArray(values) || values.some((item) => !field.options.some(({ value }) => value === item))) {
      throw new Error('Elige únicamente opciones de la lista.')
    }
  } else {
    if (typeof value !== 'string' || !value.trim()) throw new Error('Ingresa un texto no vacío.')
    if (field.format === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) throw new Error('Ingresa un correo válido, por ejemplo reservas@ejemplo.cl.')
    if (field.format === 'phone' && (!/^\+?[\d ()-]+$/.test(value) || value.replace(/\D/g, '').length < 8 || value.replace(/\D/g, '').length > 15)) throw new Error('Ingresa un teléfono de 8 a 15 dígitos; puede incluir +, espacios y guiones.')
    if (field.format === 'url' || field.format === 'image') {
      if (field.format === 'image' && /^\/(?!\/)[^\s?#]+$/.test(value) && !value.split('/').includes('..')) return
      try {
        const url = new URL(value)
        if (!['http:', 'https:'].includes(url.protocol) || !url.hostname || url.username || url.password) throw new Error()
      } catch { throw new Error('Usa una URL http:// o https:// válida, o /images/archivo.jpg para una foto local.') }
    }
  }
}

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

export function validateLocation(location, entries, categories = CATEGORIES) {
  const category = categories.find(({ id }) => id === location.categoryId)
  if (!category) throw new Error('La categoría no existe.')
  const validateFields = (values, fields) => {
    for (const [key, field] of Object.entries(fields)) {
      try { validateValue(values?.[key], field) }
      catch (error) { throw new Error(`${field.label}: ${error.message}`, { cause: error }) }
    }
  }
  validateFields(location, commonFields)
  validateFields(location.contact, contactFields)
  validateFields(location.attributes, attributeFields(category))
  validateFields(location.location, { latitude: number('Latitud', -90, 90, false), longitude: number('Longitud', -180, 180, false) })
  validateValue(location.amenityIds, amenities)
  if (!location.id || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(location.slug)) throw new Error('Identificador o URL inválidos.')
  if (entries.some((entry) => entry.id === location.id || entry.slug === location.slug)) throw new Error('Ya existe ese identificador o URL. Reinicia el asistente.')
  if (entries.some((entry) => normalize(entry.name) === normalize(location.name) && normalize(entry.address) === normalize(location.address))) throw new Error('Ya existe un lugar con ese nombre y dirección.')
  for (let day = 0; day < 7; day++) {
    const hours = location.openingHours[day]
    if (hours === null) continue
    validateFields(hours, { open: number('Apertura', 0, 23), close: number('Cierre', 1, 24) })
    if (hours.close <= hours.open) throw new Error('El cierre debe ser posterior a la apertura.')
  }
  for (const rule of location.rules) validateValue(rule, text('Regla'))
  for (const image of location.images) validateValue(image, photo)
  if (location.images.length !== location.photoCaptions.length) throw new Error('Cada foto necesita una descripción.')
  for (const caption of location.photoCaptions) validateValue(caption, text('Descripción de la foto'))
  const ids = new Set(entries.flatMap((entry) => [entry.id, ...entry.spaces.map(({ id }) => id)]))
  ids.add(location.id)
  for (const space of location.spaces) {
    if (!SPACE_TYPES.includes(space.type)) throw new Error('Tipo reservable desconocido.')
    if (!space.id || ids.has(space.id)) throw new Error('Identificador de espacio duplicado.')
    ids.add(space.id)
    validateFields(space, spaceFields)
    validateFields(space.type === 'meeting_room' ? { ...space, ...space.capacity } : space, spaceSpecific[space.type])
    if (space.type === 'coworking' && space.capacity !== 1) throw new Error('Cada escritorio se reserva para una persona.')
    if (space.type === 'meeting_room' && space.capacity.max < space.capacity.min) throw new Error('La capacidad máxima debe ser mayor o igual a la mínima.')
    if (!Object.values(location.openingHours).some((hours) => hours && hours.close - hours.open >= space.minHours)) throw new Error('El mínimo de reserva no cabe en ningún horario de apertura.')
  }
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
    writeFileSync(tempFd, JSON.stringify([...entries, location], null, 2) + '\n')
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
    const values = {}
    for (const [key, definition] of Object.entries(definitions)) {
      const value = await field(definition)
      if (value !== undefined) values[key] = value
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
    const specific = await fields(spaceSpecific[type])
    if (type === 'meeting_room') {
      while (specific.max < specific.min) {
        output('La capacidad máxima debe ser mayor o igual a la mínima.')
        specific.max = await field(spaceSpecific.meeting_room.max)
      }
      space.capacity = { min: specific.min, max: specific.max }
      space.equipment = specific.equipment ?? []
    } else Object.assign(space, specific, type === 'coworking' ? { capacity: 1 } : {})
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
