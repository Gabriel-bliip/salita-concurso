import { ArrowRight, CalendarClock, CreditCard, LayoutGrid } from 'lucide-react'
import Button from '../components/Button.tsx'
import CoworkCard from '../components/CoworkCard.tsx'
import { COMUNAS, COWORKS } from '../data/coworks.ts'

const FEATURED_COWORK_SLUGS = ['casa-lastarria', 'patio-italia', 'distrito-golf']

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
  return (
    <>
      <section className="bg-linear-to-b from-brand-50 to-white">
        <div className="mx-auto max-w-6xl px-4 pt-16 pb-12 sm:px-6 sm:pt-24 sm:pb-16">
          <p className="text-sm font-semibold text-brand-700">Coworks en Santiago</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-bold tracking-tight text-slate-900 sm:text-6xl">
            Reserva tu espacio de trabajo por hora en Santiago
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-slate-600">
            Escritorios, salas de reuniones y oficinas privadas cerca de tu casa o de tu próxima
            reunión. Pagas solo las horas que reservas.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Button to="/coworks">
              Explorar coworks
              <ArrowRight className="size-4" aria-hidden />
            </Button>
            <Button to="/#como-funciona" variant="secondary">
              Cómo funciona
            </Button>
          </div>
          <dl className="mt-14 grid max-w-xs grid-cols-2 gap-6">
            <div>
              <dt className="text-sm text-slate-500">Coworks</dt>
              <dd className="mt-1 text-2xl font-bold text-slate-900">{COWORKS.length}</dd>
            </div>
            <div>
              <dt className="text-sm text-slate-500">Comunas</dt>
              <dd className="mt-1 text-2xl font-bold text-slate-900">{COMUNAS.length}</dd>
            </div>
          </dl>
        </div>
      </section>

      <section id="como-funciona" className="mx-auto max-w-6xl scroll-mt-16 px-4 py-20 sm:px-6">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">Cómo funciona</h2>
        <ol className="mt-10 grid gap-8 md:grid-cols-3">
          {steps.map(({ icon: Icon, title, text }, index) => (
            <li key={title} className="flex flex-col gap-3">
              <span className="flex size-12 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
                <Icon className="size-6" aria-hidden />
              </span>
              <h3 className="font-semibold text-slate-900">
                {index + 1}. {title}
              </h3>
              <p className="text-slate-600">{text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="bg-slate-50">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">Coworks destacados</h2>
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
        <div className="mx-auto max-w-6xl rounded-3xl bg-brand-900 px-6 py-14 text-center sm:px-12">
          <h2 className="text-3xl font-bold tracking-tight text-white">
            Tu próxima oficina está a la vuelta de la esquina
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-brand-100">
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
