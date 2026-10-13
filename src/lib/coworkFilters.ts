import { AMENITIES } from '../data/amenities.ts'
import { COMUNAS } from '../data/coworks.ts'
import type { AmenityId, Comuna, Cowork } from '../types/index.ts'
import type { Space, SpaceType } from '../types/space.ts'
import { getCapacityRange, SPACE_TYPES } from './spaces.ts'

export interface CoworkFilterState {
  spaceType: SpaceType | null
  people: number | null
  comuna: Comuna | null
  amenityIds: AmenityId[]
}

export const EMPTY_FILTERS: CoworkFilterState = {
  spaceType: null,
  people: null,
  comuna: null,
  amenityIds: [],
}

export const PEOPLE_OPTIONS = [1, 2, 4, 6, 8, 10, 12]

// URL params: ?type=meeting_room&people=4&comuna=Providencia&amenities=wifi,parking
// Unknown values are ignored so a hand-edited URL never breaks the page.
export function parseFilters(params: URLSearchParams): CoworkFilterState {
  const type = params.get('type')
  const people = Number(params.get('people'))
  const comuna = params.get('comuna')
  const amenities = (params.get('amenities') ?? '').split(',')
  return {
    spaceType: SPACE_TYPES.find((value) => value === type) ?? null,
    people: Number.isInteger(people) && people > 0 ? people : null,
    comuna: COMUNAS.find((value) => value === comuna) ?? null,
    amenityIds: AMENITIES.filter((amenity) => amenities.includes(amenity.id)).map(
      (amenity) => amenity.id,
    ),
  }
}

export function filtersToParams(filters: CoworkFilterState) {
  const params = new URLSearchParams()
  if (filters.spaceType) params.set('type', filters.spaceType)
  if (filters.people) params.set('people', String(filters.people))
  if (filters.comuna) params.set('comuna', filters.comuna)
  if (filters.amenityIds.length > 0) params.set('amenities', filters.amenityIds.join(','))
  return params
}

export function hasActiveFilters(filters: CoworkFilterState) {
  return filtersToParams(filters).size > 0
}

function spaceMatches(space: Space, filters: CoworkFilterState) {
  if (filters.spaceType && space.type !== filters.spaceType) return false
  if (filters.people && getCapacityRange(space).max < filters.people) return false
  return true
}

// Coworks that match, each with only the spaces that fit the type and people filters.
export function filterCoworks(coworks: Cowork[], filters: CoworkFilterState) {
  return coworks
    .filter(
      (cowork) =>
        (filters.comuna === null || cowork.comuna === filters.comuna) &&
        filters.amenityIds.every((amenityId) => cowork.amenityIds.includes(amenityId)),
    )
    .map((cowork) => ({
      cowork,
      spaces: cowork.spaces.filter((space) => spaceMatches(space, filters)),
    }))
    .filter(({ spaces }) => spaces.length > 0)
}
