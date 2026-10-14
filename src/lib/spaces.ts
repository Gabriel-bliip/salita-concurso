import type { Space } from '../types/space.ts'
import { SPACE_DEFINITIONS, SPACE_TYPES } from '../data/spaceTypes.ts'
import type { SpaceType } from '../data/spaceTypes.ts'
export { SPACE_TYPES, EQUIPMENT_LABELS } from '../data/spaceTypes.ts'

export const SPACE_TYPE_LABELS = Object.fromEntries(SPACE_TYPES.map((id) => [id, SPACE_DEFINITIONS[id].label])) as Record<SpaceType, string>
export const SPACE_TYPE_PLURAL_LABELS = Object.fromEntries(SPACE_TYPES.map((id) => [id, SPACE_DEFINITIONS[id].plural])) as Record<SpaceType, string>

// How many people a single booking of this space can include.
export function getCapacityRange(space: Space) {
  // The discriminant pairs each payload with its own callback, even when a new
  // definition accepts a narrower capacity shape than the other definitions.
  const capacity = SPACE_DEFINITIONS[space.type].getCapacity as (value: Space) => { min: number; max: number }
  return capacity(space)
}

export function formatCapacity(space: Space) {
  const { min, max } = getCapacityRange(space)
  if (max === 1) return '1 persona'
  if (space.type === 'office_box') return `Hasta ${max} personas`
  return `${min}–${max} personas`
}

export function getLowestPrice(spaces: Space[]) {
  return Math.min(...spaces.map((space) => space.pricePerHour))
}
