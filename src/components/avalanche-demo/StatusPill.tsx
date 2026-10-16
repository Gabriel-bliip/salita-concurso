import { STATUS_LABEL } from './format.ts'
import type { DemoRequestStatus } from './types.ts'

const CLASSES: Record<DemoRequestStatus, string> = {
  pending: 'bg-sunken text-ink',
  approved: 'bg-primary-soft text-success',
  rejected: 'bg-primary-soft text-danger',
}

export function StatusPill({ status }: { status: DemoRequestStatus }) {
  return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${CLASSES[status]}`}>{STATUS_LABEL[status]}</span>
}
