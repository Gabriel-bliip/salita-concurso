import { formatHour } from '../../lib/format.ts'
import type { Hour, TimeSlot } from '../../types/booking.ts'

interface TimeSlotPickerProps {
  slots: TimeSlot[]
  startHour: Hour | null
  endHour: Hour | null
  onSelect: (hour: Hour) => void
}

const UNAVAILABLE_LABELS = { taken: 'Reservado', past: 'Ya pasó' }

// One button per 1-hour block. Blocks inside the chosen range are highlighted.
function TimeSlotPicker({ slots, startHour, endHour, onSelect }: TimeSlotPickerProps) {
  const inRange = (slot: TimeSlot) =>
    startHour !== null && endHour !== null && slot.start >= startHour && slot.end <= endHour

  return (
    <div className="flex flex-col gap-3">
      <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
        {slots.map((slot) => {
          const selected = inRange(slot)
          const unavailableLabel = slot.reason ? UNAVAILABLE_LABELS[slot.reason] : null
          return (
            <li key={slot.start}>
              <button
                type="button"
                disabled={!slot.available}
                aria-pressed={selected}
                aria-label={`${formatHour(slot.start)} a ${formatHour(slot.end)}${unavailableLabel ? `, ${unavailableLabel}` : ''}`}
                onClick={() => onSelect(slot.start)}
                className={`flex w-full flex-col items-center rounded-control border px-2 py-2 text-sm transition-colors disabled:cursor-not-allowed disabled:border-line disabled:bg-sunken disabled:text-ink-muted ${
                  selected
                    ? 'border-primary bg-primary text-on-primary'
                    : 'border-line-strong bg-surface text-ink hover:bg-primary-soft'
                } ${selected && !slot.available ? 'line-through' : ''}`}
              >
                <span className="font-semibold">{formatHour(slot.start)}</span>
                <span className="text-xs">{unavailableLabel ?? `hasta ${formatHour(slot.end)}`}</span>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export default TimeSlotPicker
