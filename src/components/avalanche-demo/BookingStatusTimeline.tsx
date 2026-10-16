import { Check, X } from 'lucide-react'
import type { DemoRequestStatus } from './types.ts'

export interface BookingStatusTimelineProps {
  status: DemoRequestStatus
  completed?: boolean // simulated booking completion; only meaningful when approved
  submittedAt?: string
  reviewedAt?: string
  completedAt?: string
}

type StepState = 'done' | 'current' | 'upcoming' | 'rejected' | 'skipped'

interface Step {
  label: string
  detail?: string
  state: StepState
}

function buildSteps({ status, completed = false, submittedAt, reviewedAt, completedAt }: BookingStatusTimelineProps): Step[] {
  const reviewed = status !== 'pending'
  return [
    { label: 'Solicitud enviada', detail: submittedAt, state: 'done' },
    { label: 'Revisión de la empresa', detail: reviewed ? undefined : 'En espera de aprobación', state: reviewed ? 'done' : 'current' },
    {
      label: status === 'rejected' ? 'Solicitud rechazada' : 'Solicitud aprobada',
      detail: reviewedAt,
      state: status === 'pending' ? 'upcoming' : status === 'rejected' ? 'rejected' : 'done',
    },
    {
      label: 'Reserva completada (simulada)',
      detail: status === 'rejected' ? 'No aplica' : completedAt,
      state: status === 'rejected' ? 'skipped' : status === 'approved' && completed ? 'done' : 'upcoming',
    },
  ]
}

const DOT: Record<StepState, string> = {
  done: 'bg-primary text-on-primary',
  current: 'bg-surface text-primary ring-2 ring-primary',
  upcoming: 'bg-sunken text-ink-muted',
  rejected: 'bg-danger text-on-primary',
  skipped: 'bg-sunken text-ink-muted',
}

export function BookingStatusTimeline(props: BookingStatusTimelineProps) {
  const steps = buildSteps(props)
  return (
    <ol aria-label="Estado de la solicitud" className="grid gap-0">
      {steps.map((step, index) => (
        <li key={step.label} aria-current={step.state === 'current' ? 'step' : undefined} data-state={step.state} className="relative flex gap-3 pb-5 last:pb-0">
          {index < steps.length - 1 && <span aria-hidden className={`absolute top-8 bottom-0 left-4 w-0.5 -translate-x-1/2 ${step.state === 'done' ? 'bg-primary' : 'bg-line'}`} />}
          <span className={`z-10 grid size-8 shrink-0 place-items-center rounded-full text-sm font-semibold ${DOT[step.state]}`}>
            {step.state === 'done' ? <Check aria-hidden className="size-4" /> : step.state === 'rejected' ? <X aria-hidden className="size-4" /> : index + 1}
          </span>
          <div className="pt-1">
            <p className={`text-sm font-semibold ${step.state === 'upcoming' || step.state === 'skipped' ? 'text-ink-muted' : 'text-ink'}`}>{step.label}</p>
            {step.detail && <p className="text-xs text-ink-muted">{step.detail}</p>}
          </div>
        </li>
      ))}
    </ol>
  )
}
