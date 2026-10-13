export type SpaceType = 'coworking' | 'meeting_room' | 'office_box'

export type Equipment = 'screen' | 'whiteboard' | 'video_call' | 'projector'

interface BaseSpace {
  id: string
  name: string
  description: string
  pricePerHour: number // CLP
  minHours: number
}

// A shared desk: each booking is one desk for one person.
export interface CoworkingSpace extends BaseSpace {
  type: 'coworking'
  capacity: 1
  deskCount: number
}

export interface MeetingRoom extends BaseSpace {
  type: 'meeting_room'
  capacity: { min: number; max: number }
  equipment: Equipment[]
}

export interface OfficeBox extends BaseSpace {
  type: 'office_box'
  capacity: 2 | 3 | 4 | 5 | 6
}

export type Space = CoworkingSpace | MeetingRoom | OfficeBox
