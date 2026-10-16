import type { ReactNode } from 'react'
import { STATUS_LABEL } from './format.ts'
import type { RequestStatus } from './types.ts'

const STATUS_CLASS: Record<RequestStatus, string> = {
  pending: 'bg-sunken text-ink',
  approved: 'bg-primary-soft text-success',
  rejected: 'bg-primary-soft text-danger',
}

export function StatusBadge({ status }: { status: RequestStatus }) {
  return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_CLASS[status]}`}>{STATUS_LABEL[status]}</span>
}

export function DemoBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-sunken px-3 py-1 text-xs font-semibold text-ink-muted">
      <span aria-hidden className="size-1.5 rounded-full bg-primary" />
      Modo demostración
    </span>
  )
}

export function Panel({ title, subtitle, action, children }: { title: string; subtitle?: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-panel border border-line bg-surface p-5 shadow-card sm:p-6">
      <header className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-xl">{title}</h2>
          {subtitle && <p className="mt-0.5 text-sm text-ink-muted">{subtitle}</p>}
        </div>
        {action}
      </header>
      {children}
    </section>
  )
}

export function DashboardShell({ eyebrow, title, intro, actions, children }: { eyebrow: string; title: string; intro: string; actions?: ReactNode; children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold tracking-wide text-primary uppercase">{eyebrow}</p>
          <h1 className="mt-1 text-3xl sm:text-4xl">{title}</h1>
          <p className="mt-2 max-w-2xl text-ink-muted">{intro}</p>
        </div>
        <div className="flex items-center gap-3">
          <DemoBadge />
          {actions}
        </div>
      </header>
      <div className="grid gap-6">{children}</div>
      <p className="mt-6 rounded-card bg-primary-soft p-4 text-sm text-primary" role="note">
        Demo compartida en esta pestaña. Aprobar solo actualiza datos simulados: no ejecuta transacciones ni confirma una reserva con el proveedor. Al recargar se reinicia la demo.
      </p>
      <p className="mt-8 text-center text-xs text-ink-muted">
        Datos ficticios y simulados: no hay billeteras, contratos ni pagos reales. Tasa y umbral de multifirma provisionales.
      </p>
    </div>
  )
}

export function ProgressBar({ value, max, label }: { value: number; max: number; label: string }) {
  const percent = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0
  return (
    <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent} className="h-2 w-full overflow-hidden rounded-full bg-sunken">
      <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${percent}%` }} />
    </div>
  )
}

export function Feedback({ message }: { message: { ok: boolean; text: string } | null }) {
  if (!message) return null
  return (
    <p role="status" className={`rounded-control px-3 py-2 text-sm font-semibold ${message.ok ? 'bg-primary-soft text-success' : 'bg-primary-soft text-danger'}`}>
      {message.text}
    </p>
  )
}
