import type { DateKey, SlotUnavailableReason, TimeSlot } from '../types/booking.ts'
import type { Cowork } from '../types/index.ts'
import type { Space, SpaceType } from '../types/space.ts'
import { getWeekday, toDateKey } from './dates.ts'

// Share of mock slots that show up as already booked, per space type.
const TAKEN_PERCENT: Record<SpaceType, number> = {
  coworking: 15,
  meeting_room: 30,
  office_box: 25,
}

// FNV-1a: a small stable hash, so the same space + date + hour is always taken or free.
function hash(value: string) {
  let result = 2166136261
  for (let i = 0; i < value.length; i++) {
    result ^= value.charCodeAt(i)
    result = Math.imul(result, 16777619)
  }
  return result >>> 0
}

// Mock availability: 1-hour slots within opening hours. Deterministic for a given
// space and date; only the "past" marking depends on `now`. Closed days return [].
export function getTimeSlots(cowork: Cowork, space: Space, date: DateKey, now = new Date()) {
  const hours = cowork.openingHours[getWeekday(date)]
  if (!hours) return []

  const today = toDateKey(now)
  const slots: TimeSlot[] = []
  for (let hour = hours.open; hour < hours.close; hour++) {
    let reason: SlotUnavailableReason | undefined
    if (date < today || (date === today && hour <= now.getHours())) {
      reason = 'past'
    } else if (hash(`${space.id}|${date}|${hour}`) % 100 < TAKEN_PERCENT[space.type]) {
      reason = 'taken'
    }
    slots.push(reason ? { start: hour, end: hour + 1, available: false, reason } : { start: hour, end: hour + 1, available: true })
  }
  return slots
}
