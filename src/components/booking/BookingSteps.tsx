import { Check } from 'lucide-react'
import { Link } from 'react-router'
import type { BookingStep } from '../../lib/booking.ts'
import { BOOKING_STEP_LABELS, BOOKING_STEPS } from '../../lib/booking.ts'

interface BookingStepsProps {
  current: BookingStep
  linkFor: (step: BookingStep) => string
  corporate?: boolean
}

// Progress indicator. Steps before the current one are links so the user can go back and edit.
function BookingSteps({ current, linkFor, corporate = false }: BookingStepsProps) {
  const currentIndex = BOOKING_STEPS.indexOf(current)

  return (
    <nav aria-label="Pasos de la reserva">
      <ol className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
        {BOOKING_STEPS.filter((step) => !corporate || step !== 'payment').map((step, index) => {
          const done = index < currentIndex
          const isCurrent = index === currentIndex
          const label = (
            <>
              <span
                className={`flex size-6 items-center justify-center rounded-full text-xs font-semibold ${
                  done || isCurrent ? 'bg-primary text-on-primary' : 'bg-sunken text-ink-muted'
                }`}
                aria-hidden
              >
                {done ? <Check className="size-3.5" /> : index + 1}
              </span>
              {BOOKING_STEP_LABELS[step]}
            </>
          )
          return (
            <li key={step}>
              {done ? (
                <Link to={linkFor(step)} className="flex items-center gap-2 text-ink hover:text-primary">
                  {label}
                </Link>
              ) : (
                <span
                  className={`flex items-center gap-2 ${isCurrent ? 'font-semibold text-ink' : 'text-ink-muted'}`}
                  aria-current={isCurrent ? 'step' : undefined}
                >
                  {label}
                </span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

export default BookingSteps
