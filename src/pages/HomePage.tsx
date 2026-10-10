import { ArrowRight, Building2, CreditCard, MapPin } from 'lucide-react'
import Button from '../components/Button.tsx'
import CoworkCard from '../components/CoworkCard.tsx'
import PlanCard from '../components/PlanCard.tsx'
import { COMUNAS, COWORKS } from '../data/coworks.ts'
import { PLANS } from '../data/plans.ts'
import { formatClp } from '../lib/format.ts'

const FEATURED_COWORK_SLUGS = ['casa-lastarria', 'patio-italia', 'distrito-golf']

const featuredCoworks = COWORKS.filter((cowork) => FEATURED_COWORK_SLUGS.includes(cowork.slug))
const lowestPrice = Math.min(...PLANS.map((plan) => plan.priceClp))

const steps = [
  {
    icon: CreditCard,
    title: 'Elige tu plan',
    text: 'Compra un paquete mensual de horas según cuánto trabajas fuera de casa.',
  },
  {
    icon: MapPin,
    title: 'Encuentra tu cowork',
    text: 'Filtra por comuna y servicios, y elige dónde trabajar cada día.',
  },
  {
    icon: Building2,
    title: 'Llega y trabaja',
    text: 'Haz check-in al llegar y descontamos solo las horas que usas.',
  },
]

function HomePage() {
  return (
    <>
      <section className="bg-linear-to-b from-brand-50 to-white">
        <div className="mx-auto max-w-6xl px-4 pt-16 pb-12 sm:px-6 sm:pt-24 sm:pb-16">
          <p className="text-sm font-semibold text-brand-700">Coworks en Santiago</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-bold tracking-tight text-slate-900 sm:text-6xl">
            Trabaja desde cualquier cowork de Santiago con un solo plan
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-slate-600">
            Compra horas al mes y úsalas donde más te acomode: cerca de tu casa, de una reunión o
            de tu café favorito.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Button to="/planes">
              Ver planes
              <ArrowRight className="size-4" aria-hidden />
            </Button>
            <Button to="/coworks" variant="secondary">
              Explorar coworks
            </Button>
          </div>
          <dl className="mt-14 grid max-w-xl grid-cols-3 gap-6">
            <div>
              <dt className="text-sm text-slate-500">Coworks</dt>
              <dd className="mt-1 text-2xl font-bold text-slate-900">{COWORKS.length}</dd>
            </div>
            <div>
              <dt className="text-sm text-slate-500">Comunas</dt>
              <dd className="mt-1 text-2xl font-bold text-slate-900">{COMUNAS.length}</dd>
            </div>
            <div>
              <dt className="text-sm text-slate-500">Desde</dt>
              <dd className="mt-1 text-2xl font-bold text-slate-900">{formatClp(lowestPrice)}</dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
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

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <h2 className="text-center text-3xl font-bold tracking-tight text-slate-900">
          Planes simples, sin letra chica
        </h2>
        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {PLANS.map((plan) => (
            <PlanCard key={plan.id} plan={plan} />
          ))}
        </div>
      </section>

      <section className="px-4 pb-20 sm:px-6">
        <div className="mx-auto max-w-6xl rounded-3xl bg-brand-900 px-6 py-14 text-center sm:px-12">
          <h2 className="text-3xl font-bold tracking-tight text-white">
            Tu próxima oficina está a la vuelta de la esquina
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-brand-100">
            Elige un plan y empieza a trabajar desde cualquier cowork de la red.
          </p>
          <Button to="/planes" variant="secondary" className="mt-8">
            Comenzar ahora
          </Button>
        </div>
      </section>
    </>
  )
}

export default HomePage
