import type { SpaceLocation } from '../types/index.ts'
import type { Space, SpaceType } from '../types/space.ts'
import { hasAmenity } from '../data/amenities.ts'
import { SPACE_DEFINITIONS } from '../data/spaceTypes.ts'

export const normalize = (value: string) => value.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()
export function filterLocations(entries: SpaceLocation[], filters: { name: string; category: string; comuna: string; amenity: string; type: string }) {
  return entries.filter((entry) => normalize(entry.name).includes(normalize(filters.name)) &&
    (!filters.category || entry.categoryId === filters.category) && (!filters.comuna || entry.comuna === filters.comuna) &&
    (!filters.amenity || hasAmenity(entry, filters.amenity)) &&
    (!filters.type || entry.spaces.some(({ type }) => type === filters.type)))
}
export function newSpace(type: SpaceType): Space {
  return { id: crypto.randomUUID(), type, name: '', description: '', pricePerHour: 0, minHours: 1, ...structuredClone(SPACE_DEFINITIONS[type].defaults) } as Space
}
export function newLocation(): SpaceLocation {
  return { id: crypto.randomUUID(), slug: '', name: '', categoryId: 'cowork', description: '', address: '', comuna: 'Providencia', location: { latitude: -33.42, longitude: -70.6 }, amenityIds: [], openingHours: { 0: null, 1: { open: 9, close: 18 }, 2: { open: 9, close: 18 }, 3: { open: 9, close: 18 }, 4: { open: 9, close: 18 }, 5: { open: 9, close: 18 }, 6: null }, rules: [], images: [], photoCaptions: [], spaces: [] }
}
export function duplicateLocation(entry: SpaceLocation, entries: SpaceLocation[]): SpaceLocation {
  const value = structuredClone(entry)
  value.id = crypto.randomUUID()
  value.name += ' (copia)'
  while (entries.some(({ name }) => name === value.name)) value.name += ' (copia)'
  value.slug = `${entry.slug}-${value.id}`
  value.spaces = value.spaces.map((space) => ({ ...space, id: crypto.randomUUID() }))
  return value
}
