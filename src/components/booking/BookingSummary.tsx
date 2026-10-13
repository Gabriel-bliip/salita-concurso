import { formatClp, formatDateLong, formatHours, formatTimeRange } from '../../lib/format.ts'
import { calculateBookingPrice } from '../../lib/pricing.ts'
import { SPACE_TYPE_LABELS } from '../../lib/spaces.ts'
import type { BookingSelection } from '../../lib/booking.ts'
import type { Cowork } from '../../types/index.ts'
import type { Space } from '../../types/space.ts'

interface BookingSummaryProps {
  cowork: Cowork
  space: Space | null
  selection: BookingSelection
  // Only show values that already passed validation.
  hasValidDate: boolean
  hasValidTime: boolean
  hasValidPeople: boolean
}

// Running "Tu reserva" panel, filled in as the user completes each step.
function BookingSummary({
  cowork,
  space,
  selection,
  hasValidDate,
  hasValidTime,
  hasValidPeople,
}: BookingSummaryProps) {
  const { date, startHour, endHour, people } = selection
  const hours = hasValidTime && startHour !== null && endHour !== null ? endHour - startHour : null
  const price = space && hours ? calculateBookingPrice({ pricePerHour: space.pricePerHour, hours }) : null

  const rows = [
    { label: 'Espacio', value: space ? `${space.name} · ${SPACE_TYPE_LABELS[space.type]}` : null },
    { label: 'Fecha', value: hasValidDate && date ? formatDateLong(date) : null },
    {
      label: 'Horario',
      value: hours && startHour !== null && endHour !== null ? `${formatTimeRange(startHour, endHour)} (${formatHours(hours)})` : null,
    },
    { label: 'Personas', value: hasValidPeople && people ? String(people) : null },
  ]

  return (
    <section aria-labelledby="tu-reserva" className="rounded-card border border-line bg-surface p-5">
      <h2 id="tu-reserva" className="text-lg font-semibold text-ink">
        Tu reserva
      </h2>
      <p className="mt-1 text-sm text-ink-muted">
        {cowork.name} · {cowork.address}
      </p>
      <dl className="mt-4 flex flex-col gap-3 text-sm">
        {rows.map(({ label, value }) => (
          <div key={label} className="flex justify-between gap-4">
            <dt className="text-ink-muted">{label}</dt>
            <dd className="text-right font-medium text-ink first-letter:uppercase">{value ?? '—'}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-4 flex items-baseline justify-between border-t border-line pt-4" aria-live="polite">
        <span className="text-sm text-ink-muted">Total</span>
        <span className="text-xl font-semibold text-primary">{price ? formatClp(price.total) : '—'}</span>
      </div>
      {space && <p className="mt-1 text-right text-xs text-ink-muted">{formatClp(space.pricePerHour)} por hora</p>}
    </section>
  )
}

export default BookingSummary
