import type { ReactNode } from 'react'

interface CheckboxProps {
  id: string
  checked: boolean
  onChange: (checked: boolean) => void
  onBlur?: () => void
  children: ReactNode
  describedBy?: string
  invalid?: boolean
}

function Checkbox({ id, checked, onChange, onBlur, children, describedBy, invalid }: CheckboxProps) {
  return (
    <div className="flex items-start gap-3">
      <input
        id={id}
        name={id}
        type="checkbox"
        checked={checked}
        aria-invalid={invalid ? true : undefined}
        aria-describedby={describedBy}
        onChange={(event) => onChange(event.target.checked)}
        onBlur={onBlur}
        className="mt-0.5 size-5 shrink-0 cursor-pointer accent-primary"
      />
      <label htmlFor={id} className="cursor-pointer text-ink">
        {children}
      </label>
    </div>
  )
}

export default Checkbox
