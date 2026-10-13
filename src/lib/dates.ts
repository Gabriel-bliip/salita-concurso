import type { DateKey } from '../types/booking.ts'
import type { Weekday } from '../types/index.ts'

// Dates are handled as local 'YYYY-MM-DD' keys (the demo assumes the browser is in Santiago).

export function toDateKey(date: Date): DateKey {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

export function parseDateKey(key: DateKey) {
  const [year, month, day] = key.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function getWeekday(key: DateKey) {
  return parseDateKey(key).getDay() as Weekday
}
