import type { SPACE_DEFINITIONS, SpaceType } from '../data/spaceTypes.ts'
export type { SpaceType, Equipment } from '../data/spaceTypes.ts'

interface BaseSpace {
  id: string
  name: string
  description: string
  pricePerHour: number // CLP
  minHours: number
}

export type Space = { [K in SpaceType]: BaseSpace & { type: K } & typeof SPACE_DEFINITIONS[K]['defaults'] }[SpaceType]
