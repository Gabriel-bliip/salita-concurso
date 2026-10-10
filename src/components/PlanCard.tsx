import { Check } from 'lucide-react'
import { formatClp, formatHours } from '../lib/format.ts'
import type { Plan } from '../types/index.ts'
import Button from './Button.tsx'

interface PlanCardProps {
  plan: Plan
}

function PlanCard({ plan }: PlanCardProps) {
  const pricePerHour = Math.round(plan.priceClp / plan.monthlyHours)

  return (
    <div
      className={`relative flex flex-col rounded-2xl bg-white p-6 sm:p-8 ${
        plan.highlighted ? 'shadow-xl ring-2 ring-brand-600' : 'ring-1 ring-slate-200'
      }`}
    >
      {plan.highlighted && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-600 px-3 py-1 text-xs font-semibold text-white">
          Más popular
        </span>
      )}
      <h3 className="text-lg font-semibold text-slate-900">{plan.name}</h3>
      <p className="mt-2 text-sm text-slate-600">{plan.description}</p>
      <p className="mt-6 flex items-baseline gap-1">
        <span className="text-4xl font-bold tracking-tight text-slate-900">
          {formatClp(plan.priceClp)}
        </span>
        <span className="text-sm text-slate-500">/mes</span>
      </p>
      <p className="mt-1 text-sm text-slate-500">
        {formatHours(plan.monthlyHours)} · {formatClp(pricePerHour)} por hora
      </p>
      <ul className="mt-6 flex flex-col gap-3 text-sm text-slate-700">
        {plan.features.map((feature) => (
          <li key={feature} className="flex gap-2">
            <Check className="size-5 shrink-0 text-brand-600" aria-hidden />
            {feature}
          </li>
        ))}
      </ul>
      <Button
        to="/coworks"
        variant={plan.highlighted ? 'primary' : 'secondary'}
        className="mt-8 w-full"
      >
        Elegir plan
      </Button>
    </div>
  )
}

export default PlanCard
