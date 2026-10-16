import { RotateCcw, UserRound } from 'lucide-react'
import { useNavigate } from 'react-router'
import Button from '../components/Button.tsx'
import { AvalancheTransactionCard } from '../components/avalanche-demo/AvalancheTransactionCard.tsx'
import { BookingStatusTimeline } from '../components/avalanche-demo/BookingStatusTimeline.tsx'
import { formatClp, formatHours } from '../lib/format.ts'
import { formatShortDate, formatUsdc } from './format.ts'
import { allowanceRemaining } from './logic.ts'
import { COMPANY_NAME, COMPANY_WALLET, CURRENT_EMPLOYEE_ID, MULTISIG_REQUIRED, SIGNERS } from './mockData.ts'
import { resetDemo, setBookingEmployee, useDemoState } from './store.ts'
import { DashboardShell, Panel, ProgressBar, StatusBadge } from './ui.tsx'

function todayKey() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

function EmployeeDashboard() {
  const state = useDemoState()
  const employee = state.employees.find((item) => item.id === CURRENT_EMPLOYEE_ID)
  const navigate = useNavigate()

  if (!employee) return null

  const remaining = allowanceRemaining(employee)
  const mine = state.requests.filter((request) => request.employeeId === employee.id)
  const upcoming = mine.filter((request) => request.status === 'approved' && request.date >= todayKey())
  function browse(path: string) {
    setBookingEmployee(CURRENT_EMPLOYEE_ID)
    navigate(path)
  }

  return (
    <DashboardShell
      eyebrow={`Portal empleado · ${COMPANY_NAME}`}
      title={`Hola, ${employee.name.split(' ')[0]}`}
      intro="Solicita fondos de tu empresa para reservar un cowork o una sala de reuniones y sigue el estado de cada solicitud."
      actions={
        <Button variant="secondary" onClick={resetDemo} className="gap-1.5 px-3 py-1.5">
          <RotateCcw aria-hidden className="size-4" /> Reiniciar demo
        </Button>
      }
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <Panel title="Mi billetera" subtitle="Conectada (simulada)">
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-full bg-primary-soft text-primary">
              <UserRound aria-hidden className="size-5" />
            </span>
            <div>
              <p className="font-semibold">{employee.name}</p>
              <p className="font-mono text-xs text-ink-muted">{employee.wallet}</p>
            </div>
          </div>
          <p className="mt-4 rounded-control bg-primary-soft px-3 py-2 text-sm">Reservas sin AVAX: tu empresa cubre las comisiones de red (simulado).</p>
        </Panel>

        <section className="rounded-panel bg-primary p-6 text-on-primary shadow-card lg:col-span-2">
          <p className="text-sm font-semibold text-on-primary-muted">Mi asignación</p>
          {employee.allowance === null ? (
            <>
              <p className="mt-3 font-display text-3xl sm:text-4xl">Sin tope individual</p>
              <p className="mt-1 text-sm text-on-primary-muted">Cada solicitud se revisa contra el presupuesto de la empresa.</p>
            </>
          ) : (
            <>
              <p className="mt-3 font-display text-4xl sm:text-5xl">{formatClp(remaining ?? 0)}</p>
              <p className="mt-1 text-sm text-on-primary-muted">
                disponibles de {formatClp(employee.allowance)} · ≈ {formatUsdc(remaining ?? 0)}
              </p>
              <div className="mt-5 [&>div]:bg-on-primary-muted/30 [&>div>div]:bg-on-primary">
                <ProgressBar value={employee.spent} max={employee.allowance} label="Asignación utilizada" />
              </div>
            </>
          )}
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <Panel title="Solicitar a mi empresa" subtitle="Usa los espacios y horarios del catálogo de Salita">
            <p className="text-sm leading-relaxed text-ink-muted">Elige un espacio, fecha y horario en la reserva habitual. En el resumen podrás enviar una solicitud de demo a tu empresa.</p>
            <div className="mt-5 flex flex-col gap-3">
              <Button onClick={() => browse('/espacios/cowork')}>Explorar coworks</Button>
              <Button variant="secondary" onClick={() => browse('/espacios/sala-reuniones')}>Explorar salas de reuniones</Button>
            </div>
          </Panel>
        </div>

        <div className="grid gap-6 lg:col-span-3">
          <Panel title="Solicitudes aprobadas" subtitle="Aprobaciones de demo; sin reserva confirmada">
            {upcoming.length === 0 ? (
              <p className="py-4 text-center text-ink-muted">Aún no tienes solicitudes aprobadas próximas.</p>
            ) : (
              <ul className="grid gap-3">
                {upcoming.map((request) => (
                  <li key={request.id} className="flex items-center justify-between gap-3 rounded-card border border-line bg-canvas p-4 text-sm">
                    <div>
                      <p className="font-semibold">{request.spaceName}</p>
                      <p className="text-ink-muted">
                        {formatShortDate(request.date)} · {request.startHour}:00 · {formatHours(request.hours)}
                      </p>
                    </div>
                    <span className="font-semibold">{formatClp(request.amount)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title="Historial de solicitudes">
            <ul className="grid gap-3">
              {mine.map((request) => (
                <li key={request.id} className="grid min-w-0 gap-5 rounded-card border border-line bg-canvas p-4 text-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold">{request.spaceName}</h3>
                      <p className="mt-1 text-ink-muted">
                        {formatShortDate(request.date)} · {request.startHour}:00 · {formatHours(request.hours)} · {formatClp(request.amount)}
                      </p>
                      {request.note && <p className="mt-2 text-danger">{request.note}</p>}
                    </div>
                    <StatusBadge status={request.status} />
                  </div>
                  <BookingStatusTimeline
                    status={request.status}
                    submittedAt={request.createdAt}
                    reviewedAt={request.reviewedAt}
                    completedAt="Esta demo no confirma reservas con el proveedor."
                  />
                  {request.status === 'approved' && (
                    <AvalancheTransactionCard
                      title="Autorización simulada en Avalanche"
                      walletAddress={COMPANY_WALLET}
                      txReference={`DEMO-${request.id}`}
                      signers={SIGNERS.map(({ label, wallet }) => ({ label, wallet, signed: false }))}
                      requiredSignatures={MULTISIG_REQUIRED}
                    />
                  )}
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>
    </DashboardShell>
  )
}

export default EmployeeDashboard
