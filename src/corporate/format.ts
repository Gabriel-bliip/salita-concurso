import { CLP_PER_USDC } from './mockData.ts'
import type { RequestStatus } from './types.ts'

const usdcFormatter = new Intl.NumberFormat('es-CL', { maximumFractionDigits: 0 })

// Simulated USDC equivalent at the provisional fixed rate.
export function formatUsdc(clp: number) {
  return `${usdcFormatter.format(Math.round(clp / CLP_PER_USDC))} USDC`
}

export const STATUS_LABEL: Record<RequestStatus, string> = {
  pending: 'Pendiente',
  approved: 'Aprobada',
  rejected: 'Rechazada',
}

const dateFormatter = new Intl.DateTimeFormat('es-CL', { weekday: 'short', day: 'numeric', month: 'short' })

// '2026-10-22' → 'jue, 22 oct'
export function formatShortDate(dateKey: string) {
  const [year, month, day] = dateKey.split('-').map(Number)
  return dateFormatter.format(new Date(year, month - 1, day)).replace(/\./g, '')
}
