import FieldError from './FieldError.tsx'
import { describedBy, fieldControlClass, fieldHintClass, fieldLabelClass } from './fieldStyles.ts'

interface SelectFieldProps {
  id: string
  label: string
  value: string
  options: readonly string[]
  placeholder: string
  onChange: (value: string) => void
  onBlur?: () => void
  error?: string | null
  hint?: string
  autoComplete?: string
}

function SelectField({
  id,
  label,
  value,
  options,
  placeholder,
  onChange,
  onBlur,
  error = null,
  hint,
  autoComplete,
}: SelectFieldProps) {
  return (
    <div>
      <label htmlFor={id} className={fieldLabelClass}>
        {label}
      </label>
      {hint && (
        <p id={`${id}-hint`} className={fieldHintClass}>
          {hint}
        </p>
      )}
      <select
        id={id}
        name={id}
        value={value}
        required
        autoComplete={autoComplete}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        className={fieldControlClass}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <div className="mt-1.5">
        <FieldError id={`${id}-error`} message={error} live={false} />
      </div>
    </div>
  )
}

export default SelectField
