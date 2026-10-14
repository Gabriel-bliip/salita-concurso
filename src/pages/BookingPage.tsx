import { ArrowLeft, CreditCard } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router'
import Button from '../components/Button.tsx'
import BookingDetails from '../components/booking/BookingDetails.tsx'
import BookingSteps from '../components/booking/BookingSteps.tsx'
import BookingSummary from '../components/booking/BookingSummary.tsx'
import DatePicker from '../components/booking/DatePicker.tsx'
import FieldError from '../components/form/FieldError.tsx'
import PeopleInput from '../components/booking/PeopleInput.tsx'
import PriceBreakdown from '../components/booking/PriceBreakdown.tsx'
import TimeSlotPicker from '../components/booking/TimeSlotPicker.tsx'
import SpaceCard from '../components/SpaceCard.tsx'
import { LOCATIONS } from '../data/coworks.ts'
import { getTimeSlots } from '../lib/availability.ts'
import type { BookingSelection, BookingStep } from '../lib/booking.ts'
import {
  BOOKING_STEPS,
  buildBooking,
  getBookableDates,
  parseBookingParams,
  toBookingParams,
  validateDate,
  validatePeople,
  validateTimeRange,
} from '../lib/booking.ts'
import { getWeekday } from '../lib/dates.ts'
import { formatClp, formatDateLong, formatHours, formatTimeRange } from '../lib/format.ts'
import { calculateBookingPrice } from '../lib/pricing.ts'
import { getCapacityRange, SPACE_TYPE_PLURAL_LABELS, SPACE_TYPES } from '../lib/spaces.ts'
import type { Hour } from '../types/booking.ts'
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
  const navigate = useNavigate()
  // Fixed for the whole visit so "past" slots don't shift while the user is choosing.
  const [now] = useState(() => new Date())

  const cowork = LOCATIONS.find((item) => item.slug === slug)
  if (!cowork) {
    return <NotFoundPage message="Este cowork no existe o ya no forma parte de la red." />
  }

  const { step: requestedStep, selection } = parseBookingParams(searchParams)
  const space = cowork.spaces.find((item) => item.id === selection.spaceId) ?? null
  const spaceError =
    selection.spaceId && !space ? 'Ese espacio no existe en este cowork. Elige uno de la lista.' : null

  const dateError = selection.date ? validateDate(cowork, selection.date, now) : null
  const hasValidDate = selection.date !== null && dateError === null

  const slots = space && hasValidDate && selection.date ? getTimeSlots(cowork, space, selection.date, now) : []
  const { startHour, endHour } = selection
  const timeError =
    space && startHour !== null && endHour !== null
      ? validateTimeRange(slots, startHour, endHour, space.minHours)
      : null
  const hasValidTime = startHour !== null && endHour !== null && timeError === null

  const capacity = space ? getCapacityRange(space) : { min: 1, max: 1 }
  // Until the user picks a number, suggest the minimum the space allows.
  const people = selection.people ?? capacity.min
  const peopleError = space ? validatePeople(space, people) : null
  const hasValidPeople = selection.people !== null && peopleError === null

  const booking = hasValidTime && hasValidPeople ? buildBooking(cowork, selection) : null
  const price = booking
    ? calculateBookingPrice({ pricePerHour: booking.pricePerHour, hours: booking.hours })
    : null

  const completed: Record<BookingStep, boolean> = {
    space: space !== null,
    date: hasValidDate,
    time: hasValidTime,
    people: hasValidPeople,
    // The summary has nothing to fill in: it's done once there's a complete booking to review.
    summary: booking !== null,
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

  const showSidebar = step !== 'summary' && step !== 'payment'

  const confirmPayment = () => {
    const params = toBookingParams(selection, 'payment')
    params.delete('step')
    navigate(`/reservar/${cowork.slug}/confirmacion?${params}`)
  }

  // First tap picks the start block; a later tap extends the range to that block.
  // Tapping again after a multi-hour range (or an earlier block) starts a new range.
  const selectHour = (hour: Hour) => {
    const startsNewRange =
      startHour === null || endHour === null || endHour - startHour > 1 || hour < startHour
    update(startsNewRange ? { startHour: hour, endHour: hour + 1 } : { endHour: hour + 1 })
  }

  const dateOptions = getBookableDates(now).map((date) => {
    if (!cowork.openingHours[getWeekday(date)]) return { date, disabledReason: 'Cerrado' }
    const full = space && getTimeSlots(cowork, space, date, now).every((slot) => !slot.available)
    return full ? { date, disabledReason: 'Completo' } : { date }
  })

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <Link
        to={`/ubicaciones/${cowork.slug}`}
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

      <div className={`mt-8 grid gap-8 ${showSidebar ? 'lg:grid-cols-[1fr_20rem]' : 'max-w-3xl'}`}>
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

          {step === 'time' && space && selection.date && (
            <section className="flex flex-col gap-4">
              <StepHeading step="time" title="Elige el horario" />
              <p className="text-sm text-ink-muted">
                {formatDateLong(selection.date)}. Toca la
                hora de inicio y luego la última hora de tu reserva. Este espacio se reserva por
                mínimo {formatHours(space.minHours)}.
              </p>
              {slots.some((slot) => slot.available) ? (
                <TimeSlotPicker slots={slots} startHour={startHour} endHour={endHour} onSelect={selectHour} />
              ) : (
                <FieldError message="No quedan horas disponibles ese día para este espacio. Elige otra fecha." />
              )}
              {hasValidTime && startHour !== null && endHour !== null && (
                <p className="text-sm font-medium text-success" aria-live="polite">
                  Elegiste {formatTimeRange(startHour, endHour)} ({formatHours(endHour - startHour)}).
                </p>
              )}
              <FieldError message={timeError} />
              <div className="flex justify-between gap-4">
                <Button to={urlFor('date')} variant="secondary">
                  Atrás
                </Button>
                <Button onClick={() => goTo('people')} disabled={!hasValidTime}>
                  Continuar
                </Button>
              </div>
            </section>
          )}

          {step === 'people' && space && (
            <section className="flex flex-col gap-4">
              <StepHeading step="people" title="¿Cuántas personas?" />
              {space.type === 'coworking' ? (
                <p className="text-ink">
                  Los escritorios compartidos son para <strong>1 persona</strong> por reserva. Si
                  vienen más personas, haz una reserva por cada una.
                </p>
              ) : (
                <>
                  <label htmlFor="people" id="people-hint" className="text-sm text-ink-muted">
                    {space.name} admite {capacity.min === capacity.max ? capacity.max : `de ${capacity.min} a ${capacity.max}`}{' '}
                    personas.
                  </label>
                  <PeopleInput
                    value={people}
                    min={capacity.min}
                    max={capacity.max}
                    onChange={(value) => update({ people: value })}
                    describedBy="people-hint"
                  />
                </>
              )}
              <FieldError message={peopleError} />
              <div className="flex justify-between gap-4">
                <Button to={urlFor('time')} variant="secondary">
                  Atrás
                </Button>
                <Button onClick={() => goTo('summary', { people })} disabled={peopleError !== null}>
                  Continuar
                </Button>
              </div>
            </section>
          )}

          {step === 'summary' && booking && space && price && (
            <section className="flex flex-col gap-6">
              <StepHeading step="summary" title="Revisa tu reserva" />
              <div className="rounded-card border border-line bg-surface p-5">
                <BookingDetails booking={booking} cowork={cowork} space={space} />
              </div>
              <div className="rounded-card border border-line bg-surface p-5">
                <h3 className="mb-3 text-lg font-semibold text-ink">Precio</h3>
                <PriceBreakdown price={price} />
                <p className="mt-3 text-xs text-ink-muted">
                  Pagas solo por las horas reservadas. Sin planes ni suscripciones.
                </p>
              </div>
              <div className="flex justify-between gap-4">
                <Button to={urlFor('people')} variant="secondary">
                  Atrás
                </Button>
                <Button onClick={() => goTo('payment')}>Ir al pago</Button>
              </div>
            </section>
          )}

          {step === 'payment' && booking && price && (
            <section className="flex flex-col gap-6">
              <StepHeading step="payment" title="Pago" />
              <div
                role="note"
                aria-label="Pago simulado"
                className="flex flex-col items-center gap-3 rounded-card border-2 border-dashed border-line-strong bg-sunken px-6 py-10 text-center"
              >
                <CreditCard className="size-8 text-primary" aria-hidden />
                <p className="text-lg font-semibold text-ink">Pago simulado</p>
                <p className="max-w-md text-sm text-ink-muted">
                  Aquí irá el formulario de pago. En esta demostración no se piden datos de tarjeta
                  y no se realiza ningún cobro.
                </p>
              </div>
              <div className="flex items-baseline justify-between rounded-card border border-line bg-surface p-5">
                <span className="font-semibold text-ink">Total a pagar</span>
                <span className="text-2xl font-semibold text-primary">{formatClp(price.total)}</span>
              </div>
              <div className="flex flex-wrap justify-between gap-4">
                <Button to={urlFor('summary')} variant="secondary">
                  Atrás
                </Button>
                <Button onClick={confirmPayment}>
                  Confirmar pago simulado · {formatClp(price.total)}
                </Button>
              </div>
            </section>
          )}
        </div>

        {showSidebar && (
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <BookingSummary
              cowork={cowork}
              space={space}
              selection={selection}
              hasValidDate={hasValidDate}
              hasValidTime={hasValidTime}
              hasValidPeople={hasValidPeople}
            />
          </aside>
        )}
      </div>
    </div>
  )
}

export default BookingPage
