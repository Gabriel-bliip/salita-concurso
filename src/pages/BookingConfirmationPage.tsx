import { CircleCheck, Info } from 'lucide-react'
import { Link, useParams, useSearchParams } from 'react-router'
import Button from '../components/Button.tsx'
import BookingDetails from '../components/booking/BookingDetails.tsx'
import PriceBreakdown from '../components/booking/PriceBreakdown.tsx'
import { COWORKS } from '../data/coworks.ts'
import { buildBooking, parseBookingParams } from '../lib/booking.ts'
import { calculateBookingPrice } from '../lib/pricing.ts'
import NotFoundPage from './NotFoundPage.tsx'

function BookingConfirmationPage() {
  const { slug } = useParams()
  const [searchParams] = useSearchParams()

  const cowork = COWORKS.find((item) => item.slug === slug)
  if (!cowork) {
    return <NotFoundPage message="Este cowork no existe o ya no forma parte de la red." />
  }

  const { selection } = parseBookingParams(searchParams)
  const booking = buildBooking(cowork, selection)
  const space = cowork.spaces.find((item) => item.id === booking?.spaceId)

  if (!booking || !space) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center sm:px-6">
        <h1 className="text-3xl font-bold tracking-tight text-ink">No encontramos esta reserva</h1>
        <p className="mt-4 text-ink-muted">
          El enlace está incompleto o tiene datos que no corresponden a {cowork.name}.
        </p>
        <Button to={`/reservar/${cowork.slug}`} className="mt-8">
          Hacer una reserva
        </Button>
      </div>
    )
  }

  const price = calculateBookingPrice({ pricePerHour: booking.pricePerHour, hours: booking.hours })

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <div className="flex flex-col items-center text-center">
        <CircleCheck className="size-14 text-success" aria-hidden />
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
          ¡Reserva confirmada!
        </h1>
        <p className="mt-3 text-ink-muted">
          Código de reserva{' '}
          <strong className="font-mono text-lg tracking-wider text-primary">{booking.id}</strong>
        </p>
        <p className="mt-1 text-sm text-ink-muted">Muéstralo en recepción al llegar.</p>
      </div>

      <p
        role="note"
        className="mt-8 flex items-start gap-2 rounded-card bg-sunken p-4 text-sm text-ink"
      >
        <Info className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
        Esta es una demostración: no se realizó ningún cobro y la reserva no se guardó.
      </p>

      <section aria-labelledby="detalle" className="mt-6 rounded-card border border-line bg-surface p-5">
        <h2 id="detalle" className="mb-4 text-lg font-semibold text-ink">
          Detalle
        </h2>
        <BookingDetails booking={booking} cowork={cowork} space={space} />
      </section>

      <section aria-labelledby="pago" className="mt-6 rounded-card border border-line bg-surface p-5">
        <h2 id="pago" className="mb-4 text-lg font-semibold text-ink">
          Pago
        </h2>
        <PriceBreakdown price={price} totalLabel="Total pagado (simulado)" />
      </section>

      <section aria-labelledby="reglas" className="mt-6 rounded-card border border-line bg-surface p-5">
        <h2 id="reglas" className="mb-3 text-lg font-semibold text-ink">
          Antes de llegar
        </h2>
        <ul className="flex list-disc flex-col gap-2 pl-5 text-sm text-ink marker:text-primary">
          {cowork.rules.map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </ul>
        <Link
          to={`/mapa?cowork=${cowork.slug}`}
          className="mt-4 inline-block text-sm font-semibold text-primary hover:text-primary-hover"
        >
          Ver cómo llegar en el mapa →
        </Link>
      </section>

      <div className="mt-8 flex flex-wrap justify-center gap-4">
        <Button to="/coworks">Explorar otros coworks</Button>
        <Button to="/" variant="secondary">
          Volver al inicio
        </Button>
      </div>
    </div>
  )
}

export default BookingConfirmationPage
