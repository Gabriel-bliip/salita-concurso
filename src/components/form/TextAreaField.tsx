import FieldError from './FieldError.tsx'
import { fieldControlClass, fieldHintClass, fieldLabelClass } from './fieldStyles.ts'

interface TextAreaFieldProps {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  maxLength: number
  error?: string | null
  hint?: string
  optional?: boolean
}

// Textarea with a live "120/400" counter. maxLength stops typing past the limit.
function TextAreaField({
  id,
  label,
  value,
  onChange,
  onBlur,
  maxLength,
  error = null,
  hint,
  optional = false,
}: TextAreaFieldProps) {
  const describedBy = [hint ? `${id}-hint` : null, `${id}-counter`, error ? `${id}-error` : null]
    .filter(Boolean)
    .join(' ')
  const remaining = maxLength - value.length

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
      <textarea
        id={id}
        name={id}
        rows={4}
        value={value}
        maxLength={maxLength}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        className={`${fieldControlClass} resize-y`}
      />
      <p
        id={`${id}-counter`}
        className={`mt-1 text-right text-sm ${remaining <= 20 ? 'font-semibold text-primary' : 'text-ink-muted'}`}
      >
        {value.length}/{maxLength} caracteres
      </p>
      <FieldError id={`${id}-error`} message={error} live={false} />
    </div>
  )
}

export default TextAreaField
