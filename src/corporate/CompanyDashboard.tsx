import { Minus, Plus, RotateCcw, ShieldCheck, Wallet } from 'lucide-react'
import { useState } from 'react'
import Button from '../components/Button.tsx'
import { formatClp } from '../lib/format.ts'
import { ApprovalCard } from '../components/avalanche-demo/ApprovalCard.tsx'
import { formatUsdc } from './format.ts'
import { allowanceRemaining, approvalBlockedReason, approveRequest, rejectRequest, setAllowance } from './logic.ts'
import { COMPANY_NAME, COMPANY_WALLET, MULTISIG_REQUIRED, MULTISIG_THRESHOLD, SIGNERS } from './mockData.ts'
import { resetDemo, runAction, useDemoState } from './store.ts'
import { DashboardShell, Feedback, Panel, ProgressBar, StatusBadge } from './ui.tsx'

const ALLOWANCE_STEP = 10_000

function CompanyDashboard() {
  const state = useDemoState()
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)

  const pending = state.requests.filter((request) => request.status === 'pending')
  const committed = pending.reduce((sum, request) => sum + request.amount, 0)
  const nameOf = (employeeId: string) => state.employees.find((employee) => employee.id === employeeId)?.name ?? 'Colaborador'

  function decide(requestId: string, decision: 'approve' | 'reject') {
    const result = runAction((current) => (decision === 'approve' ? approveRequest(current, requestId, 'admin') : rejectRequest(current, requestId, 'admin')))
    setMessage(result.ok ? { ok: true, text: decision === 'approve' ? 'Solicitud aprobada (simulado).' : 'Solicitud rechazada.' } : { ok: false, text: result.error })
  }

  function changeAllowance(employeeId: string, allowance: number | null) {
    const result = runAction((current) => setAllowance(current, employeeId, allowance, 'admin'))
    setMessage(result.ok ? null : { ok: false, text: result.error })
  }

  return (
    <DashboardShell
      eyebrow="Portal empresa · Demo"
      title={COMPANY_NAME}
      intro="Administra el presupuesto de espacios de trabajo, define topes por colaborador y aprueba las reservas de tu equipo."
      actions={
        <Button variant="secondary" onClick={() => { resetDemo(); setMessage(null) }} className="gap-1.5 px-3 py-1.5">
          <RotateCcw aria-hidden className="size-4" /> Reiniciar demo
        </Button>
      }
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <section className="rounded-panel bg-primary p-6 text-on-primary shadow-card lg:col-span-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-on-primary-muted">
            <Wallet aria-hidden className="size-4" /> Billetera inteligente corporativa
          </div>
          <p className="mt-3 font-display text-4xl sm:text-5xl">{formatUsdc(state.walletBalance)}</p>
          <p className="mt-1 text-sm text-on-primary-muted">≈ {formatClp(state.walletBalance)} · saldo simulado</p>
          <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-on-primary-muted/30 pt-4 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-on-primary-muted">Dirección</dt>
              <dd className="font-mono font-semibold">{COMPANY_WALLET}</dd>
            </div>
            <div>
              <dt className="text-on-primary-muted">Comprometido en solicitudes</dt>
              <dd className="font-semibold">{formatUsdc(committed)}</dd>
            </div>
            <div>
              <dt className="text-on-primary-muted">Red</dt>
              <dd className="font-semibold">Avalanche (simulada)</dd>
            </div>
          </dl>
        </section>

        <Panel title="Seguridad multifirma" subtitle={`${MULTISIG_REQUIRED} de ${SIGNERS.length} firmas requeridas`}>
          <p className="flex items-start gap-2 rounded-control bg-primary-soft px-3 py-2 text-sm text-ink">
            <ShieldCheck aria-hidden className="mt-0.5 size-4 shrink-0 text-success" />
            Solicitudes desde {formatClp(MULTISIG_THRESHOLD)} requieren multifirma (umbral provisional).
          </p>
          <ul className="mt-4 grid gap-3">
            {SIGNERS.map((signer) => (
              <li key={signer.id} className="flex items-center justify-between gap-3 text-sm">
                <div>
                  <p className="font-semibold">{signer.label}</p>
                  <p className="text-ink-muted">{signer.role}</p>
                </div>
                <span className="font-mono text-xs text-ink-muted">{signer.wallet}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <Panel title="Solicitudes pendientes" subtitle={`${pending.length} por revisar`}>
        <Feedback message={message} />
        {pending.length === 0 ? (
          <p className="py-6 text-center text-ink-muted">No hay solicitudes pendientes.</p>
        ) : (
          <ul className="mt-3 grid gap-3">
            {pending.map((request) => {
              const employee = state.employees.find(({ id }) => id === request.employeeId)
              return (
                <li key={request.id}>
                  <ApprovalCard
                    request={{ ...request, employeeName: nameOf(request.employeeId), employeeArea: employee?.area }}
                    blockedReason={approvalBlockedReason(state, request)}
                    onApprove={(id) => decide(id, 'approve')}
                    onReject={(id) => decide(id, 'reject')}
                  />
                </li>
              )
            })}
          </ul>
        )}
      </Panel>

      <Panel title="Colaboradores" subtitle="Asignación individual opcional por persona">
        <ul className="grid gap-4">
          {state.employees.map((employee) => {
            const remaining = allowanceRemaining(employee)
            const hasCap = employee.allowance !== null
            return (
              <li key={employee.id} className="grid gap-3 border-b border-line pb-4 last:border-0 last:pb-0 md:grid-cols-[1.2fr_1.5fr_auto] md:items-center">
                <div>
                  <p className="font-semibold">{employee.name}</p>
                  <p className="text-sm text-ink-muted">
                    {employee.area} · <span className="font-mono text-xs">{employee.wallet}</span>
                  </p>
                </div>
                <div>
                  {hasCap ? (
                    <>
                      <ProgressBar value={employee.spent} max={employee.allowance ?? 0} label={`Gasto de ${employee.name}`} />
                      <p className="mt-1 text-xs text-ink-muted">
                        Gastado {formatClp(employee.spent)} de {formatClp(employee.allowance ?? 0)} · quedan {formatClp(remaining ?? 0)}
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-ink-muted">Sin tope individual · gastado {formatClp(employee.spent)}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    aria-label={`Bajar tope de ${employee.name}`}
                    disabled={!hasCap}
                    onClick={() => changeAllowance(employee.id, Math.max((employee.allowance ?? 0) - ALLOWANCE_STEP, employee.spent))}
                    className="grid size-9 place-items-center rounded-control bg-sunken text-ink hover:bg-primary-soft disabled:opacity-40"
                  >
                    <Minus aria-hidden className="size-4" />
                  </button>
                  <button
                    type="button"
                    aria-label={`Subir tope de ${employee.name}`}
                    disabled={!hasCap}
                    onClick={() => changeAllowance(employee.id, (employee.allowance ?? 0) + ALLOWANCE_STEP)}
                    className="grid size-9 place-items-center rounded-control bg-sunken text-ink hover:bg-primary-soft disabled:opacity-40"
                  >
                    <Plus aria-hidden className="size-4" />
                  </button>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={hasCap}
                    onClick={() => changeAllowance(employee.id, hasCap ? null : Math.max(100_000, employee.spent))}
                    className={`rounded-full px-3 py-1.5 text-sm font-semibold transition-colors ${hasCap ? 'bg-primary text-on-primary' : 'bg-sunken text-ink'}`}
                  >
                    {hasCap ? 'Con tope' : 'Sin tope'}
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Transacciones recientes" subtitle="Registro simulado de la billetera">
          <ul className="grid gap-3">
            {state.transactions.map((tx) => (
              <li key={tx.id} className="flex items-center justify-between gap-3 text-sm">
                <div>
                  <p className="font-semibold">{tx.label}</p>
                  <p className="text-ink-muted">{tx.date}</p>
                </div>
                <span className={`font-semibold ${tx.amount > 0 ? 'text-success' : 'text-ink'}`}>
                  {tx.amount === 0 ? '—' : `${tx.amount > 0 ? '+' : '−'}${formatClp(Math.abs(tx.amount))}`}
                </span>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Actividad de reservas" subtitle="Últimas decisiones sobre solicitudes">
          <ul className="grid gap-3">
            {state.requests
              .filter((request) => request.status !== 'pending')
              .slice(0, 6)
              .map((request) => (
                <li key={request.id} className="flex items-center justify-between gap-3 text-sm">
                  <div>
                    <p className="font-semibold">{request.spaceName}</p>
                    <p className="text-ink-muted">
                      {nameOf(request.employeeId)} · {formatClp(request.amount)}
                    </p>
                  </div>
                  <StatusBadge status={request.status} />
                </li>
              ))}
          </ul>
        </Panel>
      </div>
    </DashboardShell>
  )
}

export default CompanyDashboard
