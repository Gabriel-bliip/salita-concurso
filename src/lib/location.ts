import type { SpaceLocation, OpeningHours, Weekday } from '../types/index.ts'

// UBICACIÓN PREDETERMINADA: editar dirección, comuna y coordenadas juntas.
// Se aplica a todo registro sin dirección o sin coordenadas válidas.
export const DEFAULT_LOCATION = {
  address: 'Suecia 810, Providencia, Santiago de Chile',
  comuna: 'Providencia' as const,
  location: { latitude: -33.421795865179, longitude: -70.607290416391 },
}

type OptionalLocationKey = 'address' | 'location' | 'categoryId' | 'amenityIds' | 'rules' | 'images' | 'photoCaptions' | 'spaces' | 'openingHours'
export type LocationInput = Omit<SpaceLocation, OptionalLocationKey> &
  Partial<Omit<Pick<SpaceLocation, OptionalLocationKey>, 'openingHours'>> & {
    openingHours?: Partial<OpeningHours>
  }

// Absence means no service, no rule, no photo, no unit and a closed day.
// Explicit invalid values are left intact for write validation.
export function normalizeLocation(input: LocationInput): SpaceLocation {
  return {
    ...input,
    categoryId: input.categoryId ?? 'cowork',
    amenityIds: input.amenityIds ?? [],
    rules: input.rules ?? [],
    images: input.images ?? [],
    photoCaptions: input.photoCaptions ?? [],
    spaces: input.spaces ?? [],
    openingHours: Object.fromEntries(Array.from({ length: 7 }, (_, day) => [day, input.openingHours?.[day as Weekday] ?? null])) as OpeningHours,
  } as SpaceLocation
}

export function withLocation(input: LocationInput): SpaceLocation {
  const cowork = normalizeLocation(input)
  const position = cowork.location
  const validPosition = position && Number.isFinite(position.latitude) &&
    Number.isFinite(position.longitude) && Math.abs(position.latitude) <= 90 &&
    Math.abs(position.longitude) <= 180

  if (!cowork.address?.trim() || !validPosition) {
    // Sustituye el conjunto completo, incluso si había una dirección escrita:
    // evita mostrar una dirección en la ficha y otra posición en el mapa.
    return { ...cowork, ...DEFAULT_LOCATION, location: { ...DEFAULT_LOCATION.location } }
  }
  return { ...cowork, address: cowork.address.trim(), location: position }
}

// Compact only edited/new records, retaining raw properties that were not edited.
export function serializeLocation(value: SpaceLocation, original?: LocationInput): LocationInput {
  const result = structuredClone(value) as unknown as Record<string, unknown>
  for (const key of ['amenityIds', 'rules', 'images', 'photoCaptions', 'spaces'] as const) {
    if (!value[key].length) delete result[key]
  }
  for (const key of ['contact', 'attributes'] as const) {
    if (value[key] && !Object.keys(value[key]).length) delete result[key]
  }
  result.openingHours = Object.fromEntries(Object.entries(value.openingHours).filter(([, hours]) => hours !== null))
  if (!Object.keys(result.openingHours as object).length) delete result.openingHours
  if (original) {
    const baseline = withLocation(original) as unknown as Record<string, unknown>
    const raw = original as unknown as Record<string, unknown>
    for (const key of Object.keys(value)) {
      if (JSON.stringify(baseline[key]) === JSON.stringify((value as unknown as Record<string, unknown>)[key])) {
        if (Object.hasOwn(raw, key)) result[key] = structuredClone(raw[key])
        else delete result[key]
      }
    }
  }
  return result as LocationInput
}
