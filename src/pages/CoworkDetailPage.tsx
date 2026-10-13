import { ArrowLeft, Clock, MapPin, ScrollText } from 'lucide-react'
import { Link, useParams } from 'react-router'
import AmenityBadge from '../components/AmenityBadge.tsx'
import Button from '../components/Button.tsx'
import CoworkCard from '../components/CoworkCard.tsx'
import CoworkGallery from '../components/CoworkGallery.tsx'
import SpaceCard from '../components/SpaceCard.tsx'
import { COWORKS } from '../data/coworks.ts'
import { formatClp, formatOpeningHours } from '../lib/format.ts'
import { getLowestPrice, SPACE_TYPE_PLURAL_LABELS, SPACE_TYPES } from '../lib/spaces.ts'
import NotFoundPage from './NotFoundPage.tsx'

const MAX_RELATED_COWORKS = 3

// Price, hours and the main call to action. Shown inline on mobile and as a sticky sidebar on desktop.
function BookingPanel({ lowestPrice, openingHours, bookingUrl }: { lowestPrice: number; openingHours: string; bookingUrl: string }) {
  return (
    <>
      <p className="text-sm text-ink-muted">
        Desde{' '}
        <span className="text-2xl font-semibold text-primary">{formatClp(lowestPrice)}</span>{' '}
        por hora
      </p>
      <div className="flex gap-3">
        <Clock className="size-5 shrink-0 text-primary" aria-hidden />
        <div>
          <p className="text-sm font-semibold text-ink">Horario</p>
          <p className="text-sm text-ink-muted">{openingHours}</p>
        </div>
      </div>
      <Button to={bookingUrl} className="w-full">
        Reservar
      </Button>
      <p className="text-xs text-ink-muted">
        Sin planes ni suscripciones: cada reserva se paga por separado.
      </p>
    </>
  )
}

function CoworkDetailPage() {
  const { slug } = useParams()
  const cowork = COWORKS.find((item) => item.slug === slug)

  if (!cowork) {
    return <NotFoundPage message="Este cowork no existe o ya no forma parte de la red." />
  }

  const bookingUrl = `/reservar/${cowork.slug}`
  const lowestPrice = getLowestPrice(cowork.spaces)
  const spaceGroups = SPACE_TYPES.map((type) => ({
    type,
    spaces: cowork.spaces.filter((space) => space.type === type),
  })).filter((group) => group.spaces.length > 0)

  // Same comuna first, then the rest of the network.
  const relatedCoworks = COWORKS.filter((item) => item.id !== cowork.id)
    .sort((a, b) => Number(b.comuna === cowork.comuna) - Number(a.comuna === cowork.comuna))
    .slice(0, MAX_RELATED_COWORKS)

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <Link
        to="/coworks"
        className="inline-flex items-center gap-1 text-sm font-medium text-ink-muted hover:text-primary"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Volver a coworks
      </Link>

      <div className="mt-6">
        <CoworkGallery cowork={cowork} />
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_20rem]">
        <div className="min-w-0">
          <h1 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">{cowork.name}</h1>
          <p className="mt-3 flex items-center gap-1.5 text-ink-muted">
            <MapPin className="size-5 shrink-0" aria-hidden />
            {cowork.address} · {cowork.comuna}
          </p>
          <p className="mt-6 text-lg leading-relaxed text-ink">{cowork.description}</p>
          <div className="mt-6 flex flex-col gap-4 rounded-card border border-line bg-surface p-5 lg:hidden">
            <BookingPanel lowestPrice={lowestPrice} openingHours={formatOpeningHours(cowork.openingHours)} bookingUrl={bookingUrl} />
          </div>

          <section className="mt-12" aria-labelledby="espacios">
            <h2 id="espacios" className="text-2xl font-bold tracking-tight text-ink">
              Espacios para reservar
            </h2>
            <p className="mt-1 text-sm text-ink-muted">
              Precio por hora. Pagas solo las horas que reservas.
            </p>
            {spaceGroups.map(({ type, spaces }) => (
              <div key={type} className="mt-6">
                <h3 className="text-lg font-semibold text-ink">{SPACE_TYPE_PLURAL_LABELS[type]}</h3>
                <div className="mt-3 flex flex-col gap-3">
                  {spaces.map((space) => (
                    <SpaceCard
                      key={space.id}
                      space={space}
                      bookingUrl={`${bookingUrl}?space=${space.id}`}
                    />
                  ))}
                </div>
              </div>
            ))}
          </section>

          <section className="mt-12" aria-labelledby="servicios">
            <h2 id="servicios" className="text-xl font-semibold text-ink">
              Servicios
            </h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {cowork.amenityIds.map((amenityId) => (
                <AmenityBadge key={amenityId} amenityId={amenityId} />
              ))}
            </div>
          </section>

          <section className="mt-12" aria-labelledby="reglas">
            <h2 id="reglas" className="flex items-center gap-2 text-xl font-semibold text-ink">
              <ScrollText className="size-5 text-primary" aria-hidden />
              Reglas de la casa
            </h2>
            <ul className="mt-4 flex list-disc flex-col gap-2 pl-5 text-ink marker:text-primary">
              {cowork.rules.map((rule) => (
                <li key={rule}>{rule}</li>
              ))}
            </ul>
          </section>

          <section className="mt-12 rounded-card bg-primary-soft p-5" aria-labelledby="ubicacion">
            <h2 id="ubicacion" className="font-semibold text-ink">
              Ubicación
            </h2>
            <p className="mt-1 text-sm text-ink-muted">{cowork.address}</p>
            <Link to={`/mapa?cowork=${cowork.slug}`} className="mt-3 inline-flex items-center gap-2 font-medium text-primary hover:underline">
              <MapPin className="size-4" aria-hidden /> Ver ubicación en el mapa
            </Link>
          </section>
        </div>

        <aside className="hidden flex-col gap-5 self-start rounded-card border border-line bg-surface p-6 lg:sticky lg:top-24 lg:flex">
          <BookingPanel lowestPrice={lowestPrice} openingHours={formatOpeningHours(cowork.openingHours)} bookingUrl={bookingUrl} />
        </aside>
      </div>

      <section className="mt-20">
        <h2 className="text-2xl font-bold tracking-tight text-ink">Otros coworks</h2>
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {relatedCoworks.map((item) => (
            <CoworkCard key={item.id} cowork={item} />
          ))}
        </div>
      </section>
    </div>
  )
}

export default CoworkDetailPage
