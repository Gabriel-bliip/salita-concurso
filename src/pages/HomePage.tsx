import {
  ArrowDown, ArrowRight, Building2, CalendarClock, CheckCheck, CreditCard,
  FileCheck2, LayoutGrid, Network, ShieldCheck, Users, Wallet,
} from 'lucide-react'
import { lazy, Suspense, useState } from 'react'
import { Link } from 'react-router'
import Button from '../components/Button.tsx'
import CoworkCard from '../components/CoworkCard.tsx'
import { COMUNAS, COWORKS, LOCATIONS } from '../data/coworks.ts'
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

const corporateSteps = [
  { icon: Users, title: 'Colaborador', text: 'Elige dónde y cuándo trabajar.' },
  { icon: CalendarClock, title: 'Solicitud de reserva', text: 'Envía su solicitud a la empresa.' },
  { icon: FileCheck2, title: 'Aprobación de empresa', text: 'La empresa autoriza según sus políticas.' },
  { icon: Network, title: 'Avalanche', text: 'Registra la autorización y la trazabilidad del pago.' },
]

function HomePage() {
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null)

  return (
    <>
      <section className="bg-linear-to-b from-primary-soft to-canvas">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 pt-16 pb-12 sm:px-6 sm:pt-24 sm:pb-16 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <p className="text-sm font-semibold text-primary">Tu espacio, tus horas · Santiago</p>
            <h1 className="mt-3 max-w-3xl text-4xl font-bold tracking-tight text-ink sm:text-6xl">
              Cowork y salas de reuniones, por hora.
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-ink-muted">
              Encuentra un lugar para concentrarte, reunirte o trabajar en equipo.
              Reserva para ti o conoce nuestra propuesta para empresas.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Button to="/espacios">
                Explorar espacios
                <ArrowRight className="size-4" aria-hidden />
              </Button>
              <Button to="/empresa" variant="secondary">
                Soluciones para empresas
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
          <div className="overflow-hidden rounded-panel border border-line bg-surface shadow-card">
            <div className="border-b border-line p-6 sm:p-8">
              <span className="inline-flex size-11 items-center justify-center rounded-card bg-primary-soft text-primary">
                <CalendarClock className="size-5" aria-hidden />
              </span>
              <p className="mt-5 text-xs font-semibold tracking-widest text-primary uppercase">Para ti</p>
              <h2 className="mt-2 text-2xl font-bold">Un lugar para cada jornada</h2>
              <p className="mt-3 text-sm leading-relaxed text-ink-muted">Elige tu espacio y reserva las horas que necesitas, sin contratos de largo plazo.</p>
              <Link to="/espacios" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary-hover">
                Encuentra tu espacio <ArrowRight className="size-4" aria-hidden />
              </Link>
            </div>
            <div className="bg-primary-soft p-6 sm:p-8">
              <p className="flex flex-wrap items-center gap-2 text-xs font-semibold tracking-widest text-primary uppercase">
                <Building2 className="size-4" aria-hidden /> Para tu empresa
                <span className="rounded-full border border-primary/20 px-2 py-1 tracking-normal normal-case">Concepto de demo</span>
              </p>
              <h2 className="mt-3 text-2xl font-bold">Flexibilidad para tu equipo</h2>
              <p className="mt-3 text-sm leading-relaxed text-ink-muted">Una propuesta con solicitudes de colaboradores, control de gastos y trazabilidad con Avalanche.</p>
              <Link to="/empresa" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary-hover">
                Explora la demo <ArrowDown className="size-4" aria-hidden />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section id="para-empresas" aria-labelledby="corporate-title" className="mx-auto max-w-6xl scroll-mt-32 px-4 py-16 sm:px-6 sm:py-20">
        <div className="rounded-panel border border-line bg-surface p-6 shadow-card sm:p-10">
          <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr] lg:items-center">
            <div>
              <span className="inline-flex rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">Concepto de demo · Ideatón Avalanche</span>
              <h2 id="corporate-title" className="mt-5 max-w-xl text-3xl font-bold tracking-tight sm:text-4xl">Espacios flexibles. Control para tu empresa.</h2>
              <p className="mt-4 max-w-xl leading-relaxed text-ink-muted">Pensado para empresas con equipos distribuidos que necesitan coworks y salas por hora, sin arriendos de largo plazo.</p>
            </div>
            <div className="rounded-card bg-primary p-6 text-on-primary">
              <Wallet className="size-6" aria-hidden />
              <h3 className="mt-4 text-xl font-bold text-on-primary">Billetera inteligente corporativa</h3>
              <p className="mt-3 text-sm leading-relaxed text-on-primary-muted">La propuesta contempla seguridad multifirma: varias personas autorizadas participarían en el control de los fondos de la empresa.</p>
            </div>
          </div>
          <div className="mt-10 border-t border-line pt-8">
            <h3 className="text-xl font-bold">Así sería una reserva corporativa</h3>
            <ol className="mt-6 grid gap-4 md:grid-cols-4">
              {corporateSteps.map(({ icon: Icon, title, text }, index) => (
                <li key={title} className="relative rounded-card border border-line bg-canvas p-5">
                  <div className="flex items-center justify-between gap-2 text-primary">
                    <Icon className="size-6" aria-hidden />
                    <span className="text-xs font-semibold">0{index + 1}</span>
                  </div>
                  <h4 className="mt-5 text-sm font-semibold text-ink">{title}</h4>
                  <p className="mt-2 text-sm leading-relaxed text-ink-muted">{text}</p>
                  {index < corporateSteps.length - 1 && (
                    <>
                      <ArrowRight className="absolute top-1/2 -right-3 z-1 hidden size-5 rounded-full bg-surface text-primary md:block" aria-hidden />
                      <ArrowDown className="absolute -bottom-3 left-1/2 z-1 size-5 -translate-x-1/2 rounded-full bg-surface text-primary md:hidden" aria-hidden />
                    </>
                  )}
                </li>
              ))}
            </ol>
          </div>
          <div className="mt-8 grid gap-6 border-t border-line pt-8 sm:grid-cols-2">
            <div className="flex gap-3">
              <CheckCheck className="mt-1 size-5 shrink-0 text-primary" aria-hidden />
              <div>
                <h3 className="font-semibold">Aprobaciones y asignaciones opcionales</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">La empresa podría revisar solicitudes y asignar límites de gasto a sus colaboradores.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <ShieldCheck className="mt-1 size-5 shrink-0 text-primary" aria-hidden />
              <div>
                <h3 className="font-semibold">Autorización y trazabilidad</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">Contratos inteligentes en Avalanche permitirían validar permisos y dejar un registro verificable de autorizaciones y pagos.</p>
              </div>
            </div>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button to="/empresa">Demo de empresa</Button>
            <Button to="/empleado" variant="secondary">Demo de empleado</Button>
          </div>
          <p className="mt-8 rounded-control bg-primary-soft px-4 py-3 text-sm leading-relaxed text-primary"><strong>Demo conceptual.</strong> Prueba los portales con datos simulados. No conecta billeteras, realiza transacciones ni confirma reservas.</p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pt-4 sm:px-6" aria-labelledby="mapa-titulo">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 id="mapa-titulo" className="text-3xl font-bold tracking-tight text-ink">
              Espacios en el mapa
            </h2>
            <p className="mt-2 text-ink-muted">Toca una burbuja para ver el espacio.</p>
          </div>
          <Link to="/espacios/cowork/mapa" className="text-sm font-semibold text-primary hover:text-primary-hover">
            Abrir mapa con filtros →
          </Link>
        </div>
        <div className="mt-6">
          <Suspense fallback={<div className="cowork-map bg-sunken" aria-hidden />}>
            <CoworkMap coworkers={LOCATIONS} selectedSlug={selectedSlug} onSelect={setSelectedSlug} />
          </Suspense>
        </div>
      </section>

      <section id="como-funciona" className="mx-auto max-w-6xl scroll-mt-32 px-4 py-20 sm:px-6">
        <h2 className="text-3xl font-bold tracking-tight text-ink">Cómo funciona</h2>
        <p className="mt-3 text-ink-muted">Para tus reservas individuales, elige y reserva directamente.</p>
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
            <Button to="/espacios/cowork" variant="secondary">
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
          <Button to="/espacios/cowork" variant="secondary" className="mt-8">
            Explorar coworks
          </Button>
        </div>
      </section>
    </>
  )
}

export default HomePage
