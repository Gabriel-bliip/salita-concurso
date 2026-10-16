import { calculateBookingPrice } from '../lib/pricing.ts'
import { isDateKey } from '../lib/dates.ts'
import type { ActionResult, BookingRequest, DemoState, Employee, Role } from './types.ts'

export function allowanceRemaining(employee: Employee): number | null {
  return employee.allowance === null ? null : Math.max(employee.allowance - employee.spent, 0)
}

function fail(error: string): ActionResult {
  return { ok: false, error }
}

export function approvalBlockedReason(state: DemoState, request: BookingRequest): string | undefined {
  const employee = state.employees.find((item) => item.id === request.employeeId)
  if (!employee) return 'Colaborador no encontrado.'
  const remaining = allowanceRemaining(employee)
  if (remaining !== null && request.amount > remaining) return 'El monto excede el tope individual del colaborador.'
  if (request.amount > state.walletBalance) return 'Saldo insuficiente en la billetera corporativa.'
}

// Approval is admin-only and rejected when it breaks the spend cap or the wallet balance.
export function approveRequest(state: DemoState, requestId: string, role: Role): ActionResult {
  if (role !== 'admin') return fail('Solo la administración puede aprobar solicitudes.')
  const request = state.requests.find((item) => item.id === requestId)
  if (!request || request.status !== 'pending') return fail('La solicitud ya no está pendiente.')
  const blockedReason = approvalBlockedReason(state, request)
  if (blockedReason) return fail(blockedReason)
  const employee = state.employees.find((item) => item.id === request.employeeId)!
  return {
    ok: true,
    state: {
      ...state,
      walletBalance: state.walletBalance - request.amount,
      employees: state.employees.map((item) => (item.id === employee.id ? { ...item, spent: item.spent + request.amount } : item)),
      requests: state.requests.map((item) => (item.id === requestId ? { ...item, status: 'approved', reviewedAt: 'Ahora' } : item)),
      transactions: [
        { id: `tx-${state.transactions.length + 1}`, kind: 'booking', label: `Aprobación simulada · ${request.spaceName}`, amount: -request.amount, date: 'Ahora', employeeId: employee.id },
        ...state.transactions,
      ],
    },
  }
}

export function rejectRequest(state: DemoState, requestId: string, role: Role): ActionResult {
  if (role !== 'admin') return fail('Solo la administración puede rechazar solicitudes.')
  const request = state.requests.find((item) => item.id === requestId)
  if (!request || request.status !== 'pending') return fail('La solicitud ya no está pendiente.')
  return {
    ok: true,
    state: { ...state, requests: state.requests.map((item) => (item.id === requestId ? { ...item, status: 'rejected', reviewedAt: 'Ahora', note: 'Rechazada por la administración.' } : item)) },
  }
}

// `allowance: null` removes the individual cap. A cap can never fall below what is already spent.
export function setAllowance(state: DemoState, employeeId: string, allowance: number | null, role: Role): ActionResult {
  if (role !== 'admin') return fail('Solo la administración puede cambiar asignaciones.')
  const employee = state.employees.find((item) => item.id === employeeId)
  if (!employee) return fail('Colaborador no encontrado.')
  if (allowance !== null && (!Number.isInteger(allowance) || allowance < employee.spent)) return fail('El tope no puede ser menor a lo ya gastado.')
  return { ok: true, state: { ...state, employees: state.employees.map((item) => (item.id === employeeId ? { ...item, allowance } : item)) } }
}

export interface NewRequestInput {
  employeeId: string
  spaceId: string
  date: string
  startHour: number
  hours: number
  spaceName: string
  locationSlug: string
  people: number
  pricePerHour: number
  amount: number // the total displayed by the existing booking summary
}

export function createRequest(state: DemoState, input: NewRequestInput): ActionResult {
  const employee = state.employees.find(({ id }) => id === input.employeeId)
  if (!employee) return fail('Colaborador no encontrado.')
  if (!input.spaceId || !input.spaceName || !input.locationSlug) return fail('Elige un espacio del catálogo.')
  if (!isDateKey(input.date)) return fail('Elige una fecha válida.')
  if (!Number.isInteger(input.hours) || input.hours < 1 || input.hours > 24) return fail('Elige una duración válida.')
  if (!Number.isInteger(input.startHour) || input.startHour < 0 || input.startHour + input.hours > 24) return fail('Elige un horario válido.')
  if (!Number.isInteger(input.people) || input.people < 1) return fail('Indica cuántas personas asistirán.')
  if (!Number.isInteger(input.pricePerHour) || input.pricePerHour < 0) return fail('El precio no es válido.')
  const amount = calculateBookingPrice({ pricePerHour: input.pricePerHour, hours: input.hours }).total
  if (!Number.isSafeInteger(amount) || input.amount !== amount) return fail('El precio cambió. Revisa el resumen de tu reserva.')
  const remaining = allowanceRemaining(employee)
  if (remaining !== null && amount > remaining) return fail('El monto excede tu asignación disponible. Solicita un ajuste a tu empresa.')
  const request: BookingRequest = { id: `rq-${state.requests.length + 1}`, ...input, amount, status: 'pending', createdAt: 'Ahora' }
  return { ok: true, state: { ...state, requests: [request, ...state.requests] } }
}
