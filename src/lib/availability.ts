import type { DateKey, SlotUnavailableReason, TimeSlot } from '../types/booking.ts'
import type { Cowork } from '../types/index.ts'
import type { Space } from '../types/space.ts'
import { SPACE_DEFINITIONS } from '../data/spaceTypes.ts'
import { getWeekday, toDateKey } from './dates.ts'
import { hash } from './hash.ts'

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
    } else if (hash(`${space.id}|${date}|${hour}`) % 100 < SPACE_DEFINITIONS[space.type].takenPercent) {
      reason = 'taken'
    }
    slots.push(reason ? { start: hour, end: hour + 1, available: false, reason } : { start: hour, end: hour + 1, available: true })
  }
  return slots
}
