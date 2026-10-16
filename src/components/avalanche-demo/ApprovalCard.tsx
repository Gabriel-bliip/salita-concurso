import { Check, X } from 'lucide-react'
import Button from '../Button.tsx'
import { formatClp, formatScheduleDate, formatScheduleRange } from './format.ts'
import { StatusPill } from './StatusPill.tsx'
import type { ApprovalRequestView } from './types.ts'

export interface ApprovalCardProps {
  request: ApprovalRequestView
  onApprove: (requestId: string) => void
  onReject: (requestId: string) => void
  disabled?: boolean // e.g. while the parent processes a decision
  blockedReason?: string // shown instead of enabling approve (e.g. over spend cap)
}

export function ApprovalCard({ request, onApprove, onReject, disabled = false, blockedReason }: ApprovalCardProps) {
  const isPending = request.status === 'pending'
  return (
    <article aria-label={`Solicitud de ${request.employeeName}`} className="rounded-card border border-line bg-surface p-4 shadow-card sm:p-5">
      <header className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-lg">{request.spaceName}</h3>
          <p className="text-sm text-ink-muted">
            {request.employeeName}
            {request.employeeArea ? ` · ${request.employeeArea}` : ''}
          </p>
        </div>
        <StatusPill status={request.status} />
      </header>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
        <div className="text-sm">
          <p className="font-semibold">{formatScheduleDate(request.date)}</p>
          <p className="text-ink-muted">{formatScheduleRange(request)}</p>
        </div>
        <p className="text-xl font-semibold">{formatClp(request.amount)}</p>
      </div>
      {request.status === 'rejected' && request.note && <p className="mt-3 text-sm text-danger">{request.note}</p>}
      {isPending ? (
        <div className="mt-4 border-t border-line pt-4">
          {blockedReason && (
            <p role="alert" className="mb-3 text-sm text-danger">
              {blockedReason}
            </p>
          )}
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button variant="secondary" disabled={disabled} onClick={() => onReject(request.id)} className="gap-1.5">
              <X aria-hidden className="size-4" /> Rechazar
            </Button>
            <Button disabled={disabled || Boolean(blockedReason)} onClick={() => onApprove(request.id)} className="gap-1.5">
              <Check aria-hidden className="size-4" /> Aprobar
            </Button>
          </div>
        </div>
      ) : (
        <p className="mt-3 text-sm text-ink-muted">{request.status === 'approved' ? 'Aprobada por la empresa (simulado).' : 'Rechazada por la empresa.'}</p>
      )}
    </article>
  )
}
