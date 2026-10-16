import { formatClp } from '../../lib/format.ts'
import type { DemoSchedule } from './types.ts'

export { formatClp }

const dateFormatter = new Intl.DateTimeFormat('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })

// '2026-10-22' → 'Jueves, 22 de octubre'
export function formatScheduleDate(dateKey: string) {
  const [year, month, day] = dateKey.split('-').map(Number)
  const text = dateFormatter.format(new Date(year, month - 1, day))
  return text.charAt(0).toUpperCase() + text.slice(1)
}

// '10:00–13:00 · 3 horas'
export function formatScheduleRange({ startHour, hours }: Pick<DemoSchedule, 'startHour' | 'hours'>) {
  return `${startHour}:00–${startHour + hours}:00 · ${hours} ${hours === 1 ? 'hora' : 'horas'}`
}

export const STATUS_LABEL = { pending: 'Pendiente', approved: 'Aprobada', rejected: 'Rechazada' } as const
