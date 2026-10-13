import type { OpeningHours, Weekday } from '../types/index.ts'

const clpFormatter = new Intl.NumberFormat('es-CL', {
  style: 'currency',
  currency: 'CLP',
  maximumFractionDigits: 0,
})

export function formatClp(amount: number) {
  return clpFormatter.format(amount)
}

export function formatHours(hours: number) {
  return `${hours} ${hours === 1 ? 'hora' : 'horas'}`
}

export function formatHour(hour: number) {
  return `${hour}:00`
}

const WEEKDAY_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const MONDAY_FIRST: Weekday[] = [1, 2, 3, 4, 5, 6, 0]

// Groups consecutive days with the same hours: 'Lun–Vie 8:00–20:00 · Sáb 10:00–14:00'.
export function formatOpeningHours(openingHours: OpeningHours) {
  const groups: { from: Weekday; to: Weekday; open: number; close: number }[] = []
  for (const day of MONDAY_FIRST) {
    const hours = openingHours[day]
    if (!hours) continue
    const last = groups.at(-1)
    const isNextDay = last && MONDAY_FIRST.indexOf(last.to) + 1 === MONDAY_FIRST.indexOf(day)
    if (last && isNextDay && last.open === hours.open && last.close === hours.close) {
      last.to = day
    } else {
      groups.push({ from: day, to: day, ...hours })
    }
  }
  return groups
    .map(({ from, to, open, close }) => {
      const days = from === to ? WEEKDAY_SHORT[from] : `${WEEKDAY_SHORT[from]}–${WEEKDAY_SHORT[to]}`
      return `${days} ${formatHour(open)}–${formatHour(close)}`
    })
    .join(' · ')
}
