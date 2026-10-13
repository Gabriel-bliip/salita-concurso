import { AMENITIES } from '../data/amenities.ts'
import { LOCATIONS } from '../data/coworks.ts'
import { COWORK_CATEGORY } from '../data/categories.ts'
import type { Category } from '../data/categories.ts'
import type { AmenityId, Comuna, Cowork } from '../types/index.ts'
import type { Space, SpaceType } from '../types/space.ts'
import { getCapacityRange } from './spaces.ts'

export interface CoworkFilterState {
  spaceType: SpaceType | null
  people: number | null
  comuna: Comuna | null
  amenityIds: AmenityId[]
  attributes?: Record<string, string[]>
}

export const EMPTY_FILTERS: CoworkFilterState = {
  spaceType: null,
  people: null,
  comuna: null,
  amenityIds: [],
}

export const PEOPLE_OPTIONS = COWORK_CATEGORY.filters.people ?? []

export function getCategoryComunas(category: Category, locations = LOCATIONS): Comuna[] {
  return [...new Set(locations.filter(({ categoryId }) => categoryId === category.id).map(({ comuna }) => comuna))]
}

// URL params: ?type=meeting_room&people=4&comuna=Providencia&amenities=wifi,parking
// Unknown values are ignored so a hand-edited URL never breaks the page.
export function parseFilters(params: URLSearchParams, category = COWORK_CATEGORY, locations = LOCATIONS): CoworkFilterState {
  const config = category.filters
  const type = params.get('type')
  const people = Number(params.get('people'))
  const comuna = params.get('comuna')
  const amenities = (params.get('amenities') ?? '').split(',')
  return {
    spaceType: config.spaceTypes?.find((value) => value === type) ?? null,
    people: config.people?.length && Number.isInteger(people) && people > 0 ? people : null,
    comuna: config.comuna ? getCategoryComunas(category, locations).find((value) => value === comuna) ?? null : null,
    amenityIds: AMENITIES.filter((amenity) => config.amenityIds?.includes(amenity.id) && amenities.includes(amenity.id)).map(
      (amenity) => amenity.id,
    ),
    attributes: Object.fromEntries((config.attributes ?? []).map((filter) => [
      filter.id,
      filter.options.filter(({ value }) => params.getAll(`attribute.${filter.id}`).includes(value)).map(({ value }) => value),
    ])),
  }
}

export function filtersToParams(filters: CoworkFilterState) {
  const params = new URLSearchParams()
  if (filters.spaceType) params.set('type', filters.spaceType)
  if (filters.people) params.set('people', String(filters.people))
  if (filters.comuna) params.set('comuna', filters.comuna)
  if (filters.amenityIds.length > 0) params.set('amenities', filters.amenityIds.join(','))
  for (const [id, values] of Object.entries(filters.attributes ?? {})) {
    for (const value of values) params.append(`attribute.${id}`, value)
  }
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
export function filterCoworks(coworks: Cowork[], input: CoworkFilterState, category = COWORK_CATEGORY) {
  // Normalize here too: unsupported filters cannot leak in from another category.
  const filters = parseFilters(filtersToParams(input), category, coworks)
  return coworks
    .filter(
      (cowork) =>
        cowork.categoryId === category.id &&
        (filters.comuna === null || cowork.comuna === filters.comuna) &&
        filters.amenityIds.every((amenityId) => cowork.amenityIds.includes(amenityId)) &&
        Object.entries(filters.attributes ?? {}).every(([id, values]) => {
          const attribute = cowork.attributes?.[id]
          const available = attribute == null ? [] : Array.isArray(attribute) ? attribute : [String(attribute)]
          return values.every((value) => available.includes(value))
        }),
    )
    .map((cowork) => ({
      cowork,
      spaces: cowork.spaces.filter((space) => spaceMatches(space, filters)),
    }))
    .filter(({ spaces }) => spaces.length > 0 || (!filters.spaceType && !filters.people))
}
