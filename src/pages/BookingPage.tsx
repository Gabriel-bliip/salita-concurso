import { ArrowLeft } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router'
import Button from '../components/Button.tsx'
import BookingSteps from '../components/booking/BookingSteps.tsx'
import BookingSummary from '../components/booking/BookingSummary.tsx'
import DatePicker from '../components/booking/DatePicker.tsx'
import FieldError from '../components/booking/FieldError.tsx'
import SpaceCard from '../components/SpaceCard.tsx'
import { COWORKS } from '../data/coworks.ts'
import { getTimeSlots } from '../lib/availability.ts'
import type { BookingSelection, BookingStep } from '../lib/booking.ts'
import {
  BOOKING_STEPS,
  getBookableDates,
  parseBookingParams,
  toBookingParams,
  validateDate,
} from '../lib/booking.ts'
import { getWeekday } from '../lib/dates.ts'
import { SPACE_TYPE_PLURAL_LABELS, SPACE_TYPES } from '../lib/spaces.ts'
import NotFoundPage from './NotFoundPage.tsx'

function StepHeading({ step, title }: { step: BookingStep; title: string }) {
  return (
    <h2 className="text-2xl font-bold tracking-tight text-ink">
      {BOOKING_STEPS.indexOf(step) + 1}. {title}
    </h2>
  )
}

function BookingPage() {
  const { slug } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  // Fixed for the whole visit so "past" slots don't shift while the user is choosing.
  const [now] = useState(() => new Date())

  const cowork = COWORKS.find((item) => item.slug === slug)
  if (!cowork) {
    return <NotFoundPage message="Este cowork no existe o ya no forma parte de la red." />
  }

  const { step: requestedStep, selection } = parseBookingParams(searchParams)
  const space = cowork.spaces.find((item) => item.id === selection.spaceId) ?? null
  const spaceError =
    selection.spaceId && !space ? 'Ese espacio no existe en este cowork. Elige uno de la lista.' : null

  const dateError = selection.date ? validateDate(cowork, selection.date, now) : null
  const hasValidDate = selection.date !== null && dateError === null

  const completed: Record<BookingStep, boolean> = {
    space: space !== null,
    date: hasValidDate,
    time: false,
    people: false,
    summary: false,
    payment: false,
  }
  // A hand-edited URL can't skip ahead: show the first step that still needs input.
  const firstIncomplete = BOOKING_STEPS.find((item) => !completed[item]) ?? 'payment'
  const step =
    BOOKING_STEPS.indexOf(requestedStep) > BOOKING_STEPS.indexOf(firstIncomplete)
      ? firstIncomplete
      : requestedStep

  const urlFor = (target: BookingStep, changes: Partial<BookingSelection> = {}) =>
    `?${toBookingParams({ ...selection, ...changes }, target)}`
  // Moving between steps adds a history entry (browser back works); edits within a step replace it.
  const goTo = (target: BookingStep, changes: Partial<BookingSelection> = {}) =>
    setSearchParams(toBookingParams({ ...selection, ...changes }, target))
  const update = (changes: Partial<BookingSelection>) =>
    setSearchParams(toBookingParams({ ...selection, ...changes }, step), { replace: true })

  const dateOptions = getBookableDates(now).map((date) => {
    if (!cowork.openingHours[getWeekday(date)]) return { date, disabledReason: 'Cerrado' }
    const full = space && getTimeSlots(cowork, space, date, now).every((slot) => !slot.available)
    return full ? { date, disabledReason: 'Completo' } : { date }
  })

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <Link
        to={`/coworks/${cowork.slug}`}
        className="inline-flex items-center gap-1 text-sm font-medium text-ink-muted hover:text-primary"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Volver a {cowork.name}
      </Link>
      <h1 className="mt-4 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
        Reservar en {cowork.name}
      </h1>
      <div className="mt-6">
        <BookingSteps current={step} linkFor={(target) => urlFor(target)} />
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_20rem]">
        <div className="flex min-w-0 flex-col gap-6">
          {step === 'space' && (
            <section className="flex flex-col gap-4">
              <StepHeading step="space" title="Elige un espacio" />
              <FieldError message={spaceError} />
              {SPACE_TYPES.map((type) => {
                const spaces = cowork.spaces.filter((item) => item.type === type)
                if (spaces.length === 0) return null
                return (
                  <div key={type}>
                    <h3 className="text-lg font-semibold text-ink">{SPACE_TYPE_PLURAL_LABELS[type]}</h3>
                    <div className="mt-3 flex flex-col gap-3">
                      {spaces.map((item) => (
                        <SpaceCard
                          key={item.id}
                          space={item}
                          actionLabel="Elegir"
                          selected={item.id === space?.id}
                          // Times and people depend on the space, so changing it clears them.
                          bookingUrl={urlFor('date', {
                            spaceId: item.id,
                            startHour: null,
                            endHour: null,
                            people: null,
                          })}
                        />
                      ))}
                    </div>
                  </div>
                )
              })}
            </section>
          )}

          {step === 'date' && (
            <section className="flex flex-col gap-4">
              <StepHeading step="date" title="Elige el día" />
              <p className="text-sm text-ink-muted">
                Puedes reservar desde hoy y hasta 14 días en adelante.
              </p>
              <DatePicker
                options={dateOptions}
                selected={hasValidDate ? selection.date : null}
                onSelect={(date) => update({ date, startHour: null, endHour: null })}
              />
              <FieldError message={dateError} />
              <div className="flex justify-between gap-4">
                <Button to={urlFor('space')} variant="secondary">
                  Atrás
                </Button>
                <Button onClick={() => goTo('time')} disabled={!hasValidDate}>
                  Continuar
                </Button>
              </div>
            </section>
          )}

          {(step === 'time' || step === 'people' || step === 'summary' || step === 'payment') && (
            <section className="rounded-card border border-dashed border-line-strong p-6 text-ink-muted">
              Este paso se agrega en el siguiente commit.
            </section>
          )}
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <BookingSummary
            cowork={cowork}
            space={space}
            selection={selection}
            hasValidDate={hasValidDate}
            hasValidTime={false}
            hasValidPeople={false}
          />
        </aside>
      </div>
    </div>
  )
}

export default BookingPage
