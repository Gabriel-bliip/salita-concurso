import { Building2, CalendarCheck, Coffee, Wifi } from 'lucide-react'
import PlanCard from '../components/PlanCard.tsx'
import { COWORKS } from '../data/coworks.ts'
import { PLANS } from '../data/plans.ts'

const includedInAllPlans = [
  { icon: Building2, text: `Acceso a ${COWORKS.length} coworks en Santiago` },
  { icon: CalendarCheck, text: 'Sin contrato, cancela cuando quieras' },
  { icon: Wifi, text: 'Wi-Fi de alta velocidad' },
  { icon: Coffee, text: 'Café de grano ilimitado' },
]

const faqs = [
  {
    question: '¿Cómo se descuentan las horas?',
    answer:
      'Haces check-in al llegar al cowork y check-out al irte. Descontamos solo el tiempo que estuviste, en bloques de 30 minutos.',
  },
  {
    question: '¿Puedo usar mis horas en distintos coworks?',
    answer:
      'Sí. Tus horas sirven en cualquier cowork de la red, el mismo día o en semanas distintas.',
  },
  {
    question: '¿Qué pasa si me quedo sin horas?',
    answer:
      'Puedes comprar horas adicionales en cualquier momento o subir de plan, y el cambio se aplica de inmediato.',
  },
  {
    question: '¿Puedo cambiar o cancelar mi plan?',
    answer:
      'Cuando quieras. El cambio o la cancelación se hace efectiva al comienzo del siguiente mes.',
  },
]

function PlansPage() {
  return (
    <>
      <section className="bg-linear-to-b from-brand-50 to-white">
        <div className="mx-auto max-w-6xl px-4 py-16 text-center sm:px-6 sm:py-20">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Elige las horas que necesitas
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
            Un solo plan mensual para trabajar desde cualquier cowork de la red. Paga solo por
            las horas que usas.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid gap-8 pt-4 md:grid-cols-3">
          {PLANS.map((plan) => (
            <PlanCard key={plan.id} plan={plan} />
          ))}
        </div>

        <div className="mt-12 grid gap-4 rounded-2xl bg-slate-50 p-6 sm:grid-cols-2 lg:grid-cols-4">
          {includedInAllPlans.map(({ icon: Icon, text }) => (
            <p key={text} className="flex items-center gap-3 text-sm text-slate-700">
              <Icon className="size-5 shrink-0 text-brand-600" aria-hidden />
              {text}
            </p>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
        <h2 className="text-center text-2xl font-bold text-slate-900">Preguntas frecuentes</h2>
        <div className="mt-8 divide-y divide-slate-200 border-y border-slate-200">
          {faqs.map((faq) => (
            <details key={faq.question} className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between font-medium text-slate-900">
                {faq.question}
                <span className="ml-4 text-xl text-slate-400 transition group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-slate-600">{faq.answer}</p>
            </details>
          ))}
        </div>
      </section>
    </>
  )
}

export default PlansPage
