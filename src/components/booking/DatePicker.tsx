import { formatDateLong, formatDateParts } from '../../lib/format.ts'
import type { DateKey } from '../../types/booking.ts'

export interface DateOption {
  date: DateKey
  // Why the day can't be picked (e.g. 'Cerrado'); undefined when it can.
  disabledReason?: string
}

interface DatePickerProps {
  options: DateOption[]
  selected: DateKey | null
  onSelect: (date: DateKey) => void
}

function DatePicker({ options, selected, onSelect }: DatePickerProps) {
  return (
    <ul className="grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-7">
      {options.map(({ date, disabledReason }) => {
        const { weekday, day, month } = formatDateParts(date)
        const isSelected = date === selected
        return (
          <li key={date}>
            <button
              type="button"
              disabled={Boolean(disabledReason)}
              aria-pressed={isSelected}
              aria-label={`${formatDateLong(date)}${disabledReason ? `, ${disabledReason}` : ''}`}
              onClick={() => onSelect(date)}
              className={`flex w-full flex-col items-center rounded-control border px-2 py-2.5 text-sm transition-colors disabled:cursor-not-allowed disabled:border-line disabled:bg-sunken disabled:text-ink-muted ${
                isSelected
                  ? 'border-primary bg-primary text-on-primary'
                  : 'border-line-strong bg-surface text-ink hover:bg-primary-soft'
              }`}
            >
              <span className="capitalize">{weekday}</span>
              <span className="text-lg font-semibold">{day}</span>
              <span className="text-xs">{disabledReason ?? month}</span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}

export default DatePicker
