import { CATEGORIES } from '../data/categories.ts'
import { AMENITIES } from '../data/amenities.ts'
import { SPACE_DEFINITIONS, SPACE_TYPES, spaceFields } from '../data/spaceTypes.ts'
import { COMUNA_OPTIONS } from '../types/index.ts'
import type { CategoryDefinition } from '../types/category.ts'
import { normalizeLocation } from './location.ts'
import { getCapacityRange } from './spaces.ts'
import type { LocationInput } from './location.ts'
import { attributeFields, choice, number, option, text, validateFields, validateValue } from './fields.ts'

export const commonFields = {
  name: text('Nombre del lugar'), description: text('Descripción del lugar'),
  address: text('Dirección completa', true, { example: 'Calle, número, piso, comuna y ciudad' }),
  comuna: choice('Comuna', COMUNA_OPTIONS.map((value) => option(value))),
}
export const contactFields = {
  email: text('Correo de contacto', false, { format: 'email', example: 'reservas@ejemplo.cl' }),
  phone: text('Teléfono de contacto', false, { format: 'phone', example: '+56 9 1234 5678' }),
  website: text('Sitio web', false, { format: 'url', example: 'https://ejemplo.cl' }),
}
export const coordinateFields = { latitude: number('Latitud', -90, 90, false), longitude: number('Longitud', -180, 180, false) }
export const amenities = choice('Servicios disponibles', AMENITIES.map(({ id, label }) => option(id, label)), false, true)
export const photo = text('Ruta pública o URL de la foto', true, { format: 'image', example: '/images/sala.jpg o https://ejemplo.cl/sala.jpg' })
export const normalizeName = (value: string) => value.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()

export function validateLocationShape(input: LocationInput) {
  for (const key of ['amenityIds', 'images', 'photoCaptions', 'rules', 'spaces'] as const) {
    if (input[key] !== undefined && !Array.isArray(input[key])) throw new Error(`Campo inválido: ${key}`)
  }
  if (input.openingHours !== undefined && (!input.openingHours || typeof input.openingHours !== 'object' || Array.isArray(input.openingHours))) throw new Error('Horario inválido.')
}

export function validateLocation(input: LocationInput, entries: readonly LocationInput[], categories: readonly CategoryDefinition[] = CATEGORIES) {
  validateLocationShape(input)
  const location = normalizeLocation(input)
  const category = categories.find(({ id }) => id === location.categoryId)
  if (!category) throw new Error('La categoría no existe.')
  validateFields(location, commonFields)
  validateFields(location.contact, contactFields)
  validateFields(location.attributes, attributeFields(category))
  validateFields(location.location, coordinateFields)
  validateValue(location.amenityIds, amenities)
  if (typeof location.id !== 'string' || !location.id || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(location.slug)) throw new Error('Identificador o URL inválidos.')
  const ids = new Set(entries.flatMap((entry) => [entry.id, ...(entry.spaces ?? []).map(({ id }) => id)]))
  if (ids.has(location.id) || entries.some((entry) => entry.slug === location.slug)) throw new Error('Ya existe ese identificador o URL.')
  if (entries.some((entry) => normalizeName(entry.name) === normalizeName(location.name) && normalizeName(entry.address ?? '') === normalizeName(location.address))) throw new Error('Ya existe un lugar con ese nombre y dirección.')
  for (const hours of Object.values(location.openingHours)) {
    if (hours === null) continue
    validateFields(hours, { open: number('Apertura', 0, 23), close: number('Cierre', 1, 24) })
    if (hours.close <= hours.open) throw new Error('El cierre debe ser posterior a la apertura.')
  }
  for (const rule of location.rules) validateValue(rule, text('Regla'))
  for (const image of location.images) validateValue(image, photo)
  if (location.images.length > location.photoCaptions.length) throw new Error('Cada foto necesita una descripción.')
  // Extra captions describe legacy placeholders; they are valid data, not images.
  for (const caption of location.photoCaptions) validateValue(caption, text('Descripción de la foto'))
  ids.add(location.id)
  for (const space of location.spaces) {
    if (!SPACE_TYPES.includes(space.type)) throw new Error('Tipo reservable desconocido.')
    if (typeof space.id !== 'string' || !space.id || ids.has(space.id)) throw new Error('Identificador de espacio duplicado.')
    ids.add(space.id)
    validateFields(space, spaceFields(space.type))
    const definition = SPACE_DEFINITIONS[space.type]
    if (!Object.keys(definition.fields).some((key) => key === 'capacity' || key.startsWith('capacity.')) && space.capacity !== definition.defaults.capacity) throw new Error('La capacidad fija del tipo no coincide.')
    const { min, max } = getCapacityRange(space)
    if (max < min) throw new Error('La capacidad máxima debe ser mayor o igual a la mínima.')
    if (!Object.values(location.openingHours).some((hours) => hours && hours.close - hours.open >= space.minHours)) throw new Error('El mínimo de reserva no cabe en ningún horario de apertura.')
  }
}
