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
export type CoworkingSpace = Extract<Space, { type: 'coworking' }>
export type MeetingRoom = Extract<Space, { type: 'meeting_room' }>
export type OfficeBox = Extract<Space, { type: 'office_box' }>
