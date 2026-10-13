// Whole hours of the day (0–23). Bookings use 1-hour slots.
export type Hour = number

// Local calendar date as 'YYYY-MM-DD'.
export type DateKey = string

export type SlotUnavailableReason = 'taken' | 'past'

export interface TimeSlot {
  start: Hour
  end: Hour
  available: boolean
  reason?: SlotUnavailableReason
}

export interface Booking {
  id: string
  coworkId: string
  spaceId: string
  date: DateKey
  startHour: Hour
  endHour: Hour
  people: number
  hours: number
  pricePerHour: number
  total: number
}
