import { Minus, Plus } from 'lucide-react'
import { useState } from 'react'

interface PeopleInputProps {
  value: number
  min: number
  max: number
  onChange: (people: number) => void
  describedBy?: string
}

const stepButtonClass =
  'flex size-11 items-center justify-center rounded-control border border-line-strong bg-surface text-primary hover:bg-primary-soft disabled:cursor-not-allowed disabled:border-line disabled:bg-sunken disabled:text-ink-muted'

// Number field with −/+ buttons. Typing an out-of-range value is allowed so the page can explain why it's invalid.
function PeopleInput({ value, min, max, onChange, describedBy }: PeopleInputProps) {
  const [text, setText] = useState(String(value))

  const set = (next: number) => {
    setText(String(next))
    onChange(next)
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        className={stepButtonClass}
        onClick={() => set(value - 1)}
        disabled={value <= min}
        aria-label="Una persona menos"
      >
        <Minus className="size-4" aria-hidden />
      </button>
      <input
        id="people"
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        value={text}
        aria-describedby={describedBy}
        onChange={(event) => {
          setText(event.target.value)
          onChange(event.target.value === '' ? 0 : Number(event.target.value))
        }}
        className="h-11 w-20 rounded-control border border-line-strong bg-surface text-center text-lg font-semibold text-ink"
      />
      <button
        type="button"
        className={stepButtonClass}
        onClick={() => set(value + 1)}
        disabled={value >= max}
        aria-label="Una persona más"
      >
        <Plus className="size-4" aria-hidden />
      </button>
    </div>
  )
}

export default PeopleInput
