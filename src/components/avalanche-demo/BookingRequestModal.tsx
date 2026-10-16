import type { KeyboardEvent } from 'react'
import Button from '../Button.tsx'
import { formatClp, formatScheduleDate, formatScheduleRange } from './format.ts'
import type { DemoAllowance, DemoSchedule } from './types.ts'

export interface BookingRequestModalProps extends DemoSchedule {
  open: boolean
  spaceName: string
  total: number // CLP, computed by the caller (hours × price per hour)
  employeeName: string
  companyName: string
  allowance?: DemoAllowance | null // omit or null when the employee has no individual cap
  submitting?: boolean
  error?: string | null
  onSubmit: () => void
  onCancel: () => void
}

export function BookingRequestModal({
  open,
  spaceName,
  date,
  startHour,
  hours,
  total,
  employeeName,
  companyName,
  allowance,
  submitting = false,
  error,
  onSubmit,
  onCancel,
}: BookingRequestModalProps) {
  if (!open) return null
  const remaining = allowance ? Math.max(allowance.limit - allowance.spent, 0) : null
  const overCap = remaining !== null && total > remaining
  const usedPercent = allowance && allowance.limit > 0 ? Math.min(100, Math.round(((allowance.spent + total) / allowance.limit) * 100)) : 0

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape') onCancel()
    if (event.key === 'Tab') {
      const dialog = event.currentTarget.querySelector<HTMLElement>('[role="dialog"]')
      const controls = dialog?.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled)')
      if (!dialog || !controls?.length) return
      const first = controls[0]
      const last = controls[controls.length - 1]
      if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog)) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-ink/50 p-0 sm:place-items-center sm:p-4" onKeyDown={handleKeyDown}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="booking-request-title"
        tabIndex={-1}
        className="max-h-full w-full max-w-lg overflow-y-auto rounded-t-panel bg-surface p-5 shadow-card sm:rounded-panel sm:p-6"
      >
        <p className="text-xs font-semibold tracking-wide text-primary uppercase">Modo demostración</p>
        <h2 id="booking-request-title" className="mt-1 text-2xl">
          Solicitar aprobación
        </h2>
        <p className="mt-1 text-sm text-ink-muted">Tu empresa revisará esta solicitud. La demo no realiza pagos ni confirma reservas con el proveedor.</p>

        <div className="mt-5 rounded-card bg-canvas p-4">
          <p className="font-semibold">{spaceName}</p>
          <p className="mt-1 text-sm">{formatScheduleDate(date)}</p>
          <p className="text-sm text-ink-muted">{formatScheduleRange({ startHour, hours })}</p>
          <p className="mt-3 flex items-baseline justify-between border-t border-line pt-3">
            <span className="text-sm text-ink-muted">Total</span>
            <span className="text-xl font-semibold">{formatClp(total)}</span>
          </p>
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-ink-muted">Colaborador</dt>
            <dd className="font-semibold">{employeeName}</dd>
          </div>
          <div>
            <dt className="text-ink-muted">Empresa</dt>
            <dd className="font-semibold">{companyName}</dd>
          </div>
        </dl>

        {allowance && remaining !== null && (
          <div className="mt-4">
            <div
              role="progressbar"
              aria-label="Uso de tu asignación"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={usedPercent}
              className="h-2 w-full overflow-hidden rounded-full bg-sunken"
            >
              <div className={`h-full rounded-full ${overCap ? 'bg-danger' : 'bg-primary'}`} style={{ width: `${usedPercent}%` }} />
            </div>
            <p className={`mt-1 text-xs ${overCap ? 'font-semibold text-danger' : 'text-ink-muted'}`}>
              {overCap ? `Supera tu asignación disponible (${formatClp(remaining)}).` : `Asignación disponible: ${formatClp(remaining)} de ${formatClp(allowance.limit)}.`}
            </p>
          </div>
        )}
        {!allowance && <p className="mt-4 text-sm text-ink-muted">Sin asignación individual: tu empresa revisará la solicitud contra su saldo simulado.</p>}

        {error && (
          <p role="alert" className="mt-4 text-sm font-semibold text-danger">
            {error}
          </p>
        )}

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onCancel}>
            Cancelar
          </Button>
          <Button onClick={onSubmit} disabled={submitting || overCap}>
            {submitting ? 'Enviando…' : 'Solicitar aprobación'}
          </Button>
        </div>
      </div>
    </div>
  )
}
