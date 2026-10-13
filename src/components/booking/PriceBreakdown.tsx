import { formatClp, formatHours } from '../../lib/format.ts'
import type { PriceBreakdown as PriceBreakdownData } from '../../lib/pricing.ts'

// "N horas × $X por hora = $Total". Values come from calculateBookingPrice, never computed here.
function PriceBreakdown({ price, totalLabel = 'Total' }: { price: PriceBreakdownData; totalLabel?: string }) {
  return (
    <dl className="flex flex-col gap-2 text-sm">
      <div className="flex justify-between gap-4">
        <dt className="text-ink-muted">Precio por hora</dt>
        <dd className="text-ink">{formatClp(price.pricePerHour)}</dd>
      </div>
      <div className="flex justify-between gap-4">
        <dt className="text-ink-muted">Horas reservadas</dt>
        <dd className="text-ink">{formatHours(price.hours)}</dd>
      </div>
      <div className="flex justify-between gap-4">
        <dt className="text-ink-muted">Subtotal</dt>
        <dd className="text-ink">
          {formatHours(price.hours)} × {formatClp(price.pricePerHour)} = {formatClp(price.subtotal)}
        </dd>
      </div>
      <div className="mt-2 flex items-baseline justify-between gap-4 border-t border-line pt-3">
        <dt className="font-semibold text-ink">{totalLabel}</dt>
        <dd className="text-2xl font-semibold text-primary">{formatClp(price.total)}</dd>
      </div>
    </dl>
  )
}

export default PriceBreakdown
