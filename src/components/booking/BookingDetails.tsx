import { formatDateLong, formatHours, formatTimeRange } from '../../lib/format.ts'
import { SPACE_TYPE_LABELS } from '../../lib/spaces.ts'
import type { Booking } from '../../types/booking.ts'
import type { Cowork } from '../../types/index.ts'
import type { Space } from '../../types/space.ts'

interface BookingDetailsProps {
  booking: Booking
  cowork: Cowork
  space: Space
}

function BookingDetails({ booking, cowork, space }: BookingDetailsProps) {
  const rows = [
    { label: 'Cowork', value: cowork.name },
    { label: 'Dirección', value: cowork.address },
    { label: 'Espacio', value: `${space.name} (${SPACE_TYPE_LABELS[space.type]})` },
    { label: 'Fecha', value: formatDateLong(booking.date) },
    {
      label: 'Horario',
      value: `${formatTimeRange(booking.startHour, booking.endHour)} · ${formatHours(booking.hours)}`,
    },
    { label: 'Personas', value: booking.people === 1 ? '1 persona' : `${booking.people} personas` },
  ]

  return (
    <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-[8rem_1fr]">
      {rows.map(({ label, value }) => (
        <div key={label} className="contents">
          <dt className="text-ink-muted">{label}</dt>
          <dd className="font-medium text-ink">{value}</dd>
        </div>
      ))}
    </dl>
  )
}

export default BookingDetails
