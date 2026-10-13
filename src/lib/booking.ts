import type { Booking, DateKey, Hour, TimeSlot } from '../types/booking.ts'
import type { Cowork } from '../types/index.ts'
import type { Space } from '../types/space.ts'
import { addDays, getWeekday, isDateKey, toDateKey } from './dates.ts'
import { formatHour, formatHours } from './format.ts'
import { hash } from './hash.ts'
import { calculateBookingPrice } from './pricing.ts'
import { getCapacityRange } from './spaces.ts'

export const BOOKING_STEPS = ['space', 'date', 'time', 'people', 'summary', 'payment'] as const
export type BookingStep = (typeof BOOKING_STEPS)[number]

export const BOOKING_STEP_LABELS: Record<BookingStep, string> = {
  space: 'Espacio',
  date: 'Fecha',
  time: 'Horario',
  people: 'Personas',
  summary: 'Resumen',
  payment: 'Pago',
}

// How far ahead a booking can be made, counting today.
export const BOOKING_WINDOW_DAYS = 14

export interface BookingSelection {
  spaceId: string | null
  date: DateKey | null
  startHour: Hour | null
  endHour: Hour | null
  people: number | null
}

const toInteger = (value: string | null) => {
  if (value === null || value === '') return null
  const number = Number(value)
  return Number.isInteger(number) ? number : null
}

// URL: /reservar/:slug?space=&date=&start=&end=&people=&step=
export function parseBookingParams(params: URLSearchParams) {
  const stepParam = params.get('step')
  const step = BOOKING_STEPS.find((value) => value === stepParam) ?? 'space'
  const selection: BookingSelection = {
    spaceId: params.get('space'),
    date: params.get('date'),
    startHour: toInteger(params.get('start')),
    endHour: toInteger(params.get('end')),
    people: toInteger(params.get('people')),
  }
  return { step, selection }
}

export function toBookingParams(selection: BookingSelection, step: BookingStep) {
  const params = new URLSearchParams()
  if (selection.spaceId) params.set('space', selection.spaceId)
  if (selection.date) params.set('date', selection.date)
  if (selection.startHour !== null) params.set('start', String(selection.startHour))
  if (selection.endHour !== null) params.set('end', String(selection.endHour))
  if (selection.people !== null) params.set('people', String(selection.people))
  params.set('step', step)
  return params
}

export function getBookableDates(now: Date) {
  const today = toDateKey(now)
  return Array.from({ length: BOOKING_WINDOW_DAYS }, (_, index) => addDays(today, index))
}

// Each validator returns a Spanish error message, or null when the value is valid.

export function validateDate(cowork: Cowork, date: string, now: Date) {
  if (!isDateKey(date)) return 'La fecha no es válida. Elige un día del calendario.'
  const today = toDateKey(now)
  if (date < today) return 'Esa fecha ya pasó. Elige hoy o un día futuro.'
  if (date > addDays(today, BOOKING_WINDOW_DAYS - 1)) {
    return `Solo puedes reservar hasta ${BOOKING_WINDOW_DAYS} días en adelante.`
  }
  if (!cowork.openingHours[getWeekday(date)]) return `${cowork.name} está cerrado ese día.`
  return null
}

export function validateTimeRange(
  slots: TimeSlot[],
  startHour: Hour,
  endHour: Hour,
  minHours: number,
) {
  if (slots.length === 0) return 'No hay horario de atención ese día.'
  const open = slots[0].start
  const close = slots[slots.length - 1].end
  if (startHour < open || endHour > close) {
    return `Ese horario está fuera del horario de atención (${formatHour(open)}–${formatHour(close)}).`
  }
  if (endHour <= startHour) return 'La hora de término debe ser posterior a la de inicio.'
  const blocked = slots.find((slot) => slot.start >= startHour && slot.end <= endHour && !slot.available)
  if (blocked) {
    return blocked.reason === 'past'
      ? `El bloque de las ${formatHour(blocked.start)} ya pasó. Elige un horario posterior.`
      : `El bloque de las ${formatHour(blocked.start)} ya está reservado. Elige otro horario.`
  }
  if (endHour - startHour < minHours) {
    return `Este espacio se reserva por mínimo ${formatHours(minHours)}.`
  }
  return null
}

export function validatePeople(space: Space, people: number) {
  const { min, max } = getCapacityRange(space)
  if (!Number.isInteger(people) || people < 1) return 'Indica cuántas personas asistirán.'
  if (space.type === 'coworking' && people > 1) {
    return 'Los escritorios compartidos son para 1 persona por reserva.'
  }
  if (people < min) return `Este espacio requiere al menos ${min} personas.`
  if (people > max) return `Este espacio admite hasta ${max} personas.`
  return null
}

// Stable code for the mock confirmation: the same booking always gets the same code.
function getBookingCode(coworkId: string, selection: BookingSelection) {
  const key = [coworkId, selection.spaceId, selection.date, selection.startHour, selection.endHour, selection.people].join('|')
  return `SAL-${hash(key).toString(36).toUpperCase().padStart(7, '0').slice(-6)}`
}

// Builds the booking shown on the summary and confirmation screens, or null if the
// selection is incomplete or inconsistent (e.g. a hand-edited URL).
// It doesn't re-check slot availability, so reloading a confirmation later still works.
export function buildBooking(cowork: Cowork, selection: BookingSelection): Booking | null {
  const space = cowork.spaces.find((item) => item.id === selection.spaceId)
  const { date, startHour, endHour, people } = selection
  if (!space || !date || !isDateKey(date) || startHour === null || endHour === null || people === null) {
    return null
  }
  const hours = cowork.openingHours[getWeekday(date)]
  if (!hours || startHour < hours.open || endHour > hours.close || endHour - startHour < space.minHours) {
    return null
  }
  if (validatePeople(space, people)) return null

  const price = calculateBookingPrice({ pricePerHour: space.pricePerHour, hours: endHour - startHour })
  return {
    id: getBookingCode(cowork.id, selection),
    coworkId: cowork.id,
    spaceId: space.id,
    date,
    startHour,
    endHour,
    people,
    hours: price.hours,
    pricePerHour: price.pricePerHour,
    total: price.total,
  }
}
