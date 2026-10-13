import { ArrowRight, CalendarClock, CreditCard, LayoutGrid } from 'lucide-react'
import { lazy, Suspense, useState } from 'react'
import { Link } from 'react-router'
import Button from '../components/Button.tsx'
import CoworkCard from '../components/CoworkCard.tsx'
import { COMUNAS, COWORKS } from '../data/coworks.ts'
import { formatClp } from '../lib/format.ts'
import { getLowestPrice } from '../lib/spaces.ts'

// Loaded on demand: MapLibre is heavy and shouldn't delay the first paint of the home page.
const CoworkMap = lazy(() => import('../components/CoworkMap.tsx'))

const FEATURED_COWORK_SLUGS = ['casa-lastarria', 'patio-italia', 'distrito-golf']

const lowestPrice = getLowestPrice(COWORKS.flatMap((cowork) => cowork.spaces))

const featuredCoworks = COWORKS.filter((cowork) => FEATURED_COWORK_SLUGS.includes(cowork.slug))

const steps = [
  {
    icon: LayoutGrid,
    title: 'Elige un espacio',
    text: 'Un escritorio compartido, una sala de reuniones o una oficina privada.',
  },
  {
    icon: CalendarClock,
    title: 'Escoge día y horario',
    text: 'Reserva solo el bloque de horas que necesitas, sin contratos.',
  },
  {
    icon: CreditCard,
    title: 'Paga solo por esas horas',
    text: 'Sin planes ni suscripciones: cada reserva se paga por separado.',
  },
]

function HomePage() {
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null)

  return (
    <>
      <section className="bg-linear-to-b from-primary-soft to-canvas">
        <div className="mx-auto max-w-6xl px-4 pt-16 pb-12 sm:px-6 sm:pt-24 sm:pb-16">
          <p className="text-sm font-semibold text-primary">Coworks en Santiago</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-bold tracking-tight text-ink sm:text-6xl">
            Reserva tu espacio de trabajo por hora en Santiago
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-ink-muted">
            Escritorios, salas de reuniones y oficinas privadas cerca de tu casa o de tu próxima
            reunión. Pagas solo las horas que reservas.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Button to="/espacios">
              Explorar espacios
              <ArrowRight className="size-4" aria-hidden />
            </Button>
            <Button to="/#como-funciona" variant="secondary">
              Cómo funciona
            </Button>
          </div>
          <dl className="mt-14 grid max-w-md grid-cols-3 gap-6">
            <div>
              <dt className="text-sm text-ink-muted">Coworks</dt>
              <dd className="mt-1 text-2xl font-bold text-ink">{COWORKS.length}</dd>
            </div>
            <div>
              <dt className="text-sm text-ink-muted">Comunas</dt>
              <dd className="mt-1 text-2xl font-bold text-ink">{COMUNAS.length}</dd>
            </div>
            <div>
              <dt className="text-sm text-ink-muted">Desde, por hora</dt>
              <dd className="mt-1 text-2xl font-bold text-ink">{formatClp(lowestPrice)}</dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pt-4 sm:px-6" aria-labelledby="mapa-titulo">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 id="mapa-titulo" className="text-3xl font-bold tracking-tight text-ink">
              Coworks en el mapa
            </h2>
            <p className="mt-2 text-ink-muted">Toca una burbuja para ver el espacio.</p>
          </div>
          <Link to="/mapa" className="text-sm font-semibold text-primary hover:text-primary-hover">
            Abrir mapa con filtros →
          </Link>
        </div>
        <div className="mt-6">
          <Suspense fallback={<div className="cowork-map bg-sunken" aria-hidden />}>
            <CoworkMap coworkers={COWORKS} selectedSlug={selectedSlug} onSelect={setSelectedSlug} />
          </Suspense>
        </div>
      </section>

      <section id="como-funciona" className="mx-auto max-w-6xl scroll-mt-16 px-4 py-20 sm:px-6">
        <h2 className="text-3xl font-bold tracking-tight text-ink">Cómo funciona</h2>
        <ol className="mt-10 grid gap-8 md:grid-cols-3">
          {steps.map(({ icon: Icon, title, text }, index) => (
            <li key={title} className="flex flex-col gap-3">
              <span className="flex size-12 items-center justify-center rounded-card bg-primary-soft text-primary">
                <Icon className="size-6" aria-hidden />
              </span>
              <h3 className="font-semibold text-ink">
                {index + 1}. {title}
              </h3>
              <p className="text-ink-muted">{text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 className="text-3xl font-bold tracking-tight text-ink">Coworks destacados</h2>
            <Button to="/coworks" variant="secondary">
              Ver todos
            </Button>
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featuredCoworks.map((cowork) => (
              <CoworkCard key={cowork.id} cowork={cowork} />
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 pb-20 sm:px-6">
        <div className="mx-auto max-w-6xl rounded-panel bg-primary px-6 py-14 text-center sm:px-12">
          <h2 className="text-3xl font-bold tracking-tight text-on-primary">
            Tu próxima oficina está a la vuelta de la esquina
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-on-primary-muted">
            Elige un cowork, reserva las horas que necesitas y llega a trabajar.
          </p>
          <Button to="/coworks" variant="secondary" className="mt-8">
            Explorar coworks
          </Button>
        </div>
      </section>
    </>
  )
}

export default HomePage
