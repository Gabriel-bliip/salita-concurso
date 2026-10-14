import type { HTMLInputAutoCompleteAttribute } from 'react'
import FieldError from './FieldError.tsx'
import { describedBy, fieldControlClass, fieldHintClass, fieldLabelClass } from './fieldStyles.ts'

interface TextFieldProps {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  error?: string | null
  hint?: string
  optional?: boolean
  type?: 'text' | 'email' | 'tel'
  autoComplete?: HTMLInputAutoCompleteAttribute
  maxLength?: number
}

function TextField({
  id,
  label,
  value,
  onChange,
  onBlur,
  error = null,
  hint,
  optional = false,
  type = 'text',
  autoComplete,
  maxLength,
}: TextFieldProps) {
  return (
    <div>
      <label htmlFor={id} className={fieldLabelClass}>
        {label}
        {optional && <span className="font-normal text-ink-muted"> (opcional)</span>}
      </label>
      {hint && (
        <p id={`${id}-hint`} className={fieldHintClass}>
          {hint}
        </p>
      )}
      <input
        id={id}
        name={id}
        type={type}
        value={value}
        autoComplete={autoComplete}
        maxLength={maxLength}
        required={!optional}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        className={fieldControlClass}
      />
      <div className="mt-1.5">
        <FieldError id={`${id}-error`} message={error} live={false} />
      </div>
    </div>
  )
}

export default TextField
