import { getFieldValue, setFieldValue } from '../lib/fields.ts'
import type { FormField } from '../lib/fields.ts'

// Shared field definitions drive category attributes and reservable-unit forms.
export default function SchemaFields<T extends object>({ values, fields, onChange }: {
  values: T; fields: Record<string, FormField>; onChange: (value: T) => void
}) {
  return <>{Object.entries(fields).map(([key, field]) => {
    const value = getFieldValue(values, key)
    const change = (next: unknown) => onChange(setFieldValue(values, key, next))
    return <label className="admin-field" key={key}><span>{field.label}</span>
      {field.type === 'boolean' ? <input type="checkbox" checked={value === true} onChange={(e) => change(e.target.checked)} />
        : field.type === 'select' || field.type === 'multiselect' ? <select required={field.required} multiple={field.type === 'multiselect'} value={(value ?? (field.type === 'multiselect' ? [] : '')) as string | string[]} onChange={(e) => change(field.type === 'multiselect' ? Array.from(e.target.selectedOptions, ({ value }) => value) : e.target.value || undefined)}>
          {field.type === 'select' && <option value="">Selecciona</option>}
          {field.options?.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
        </select> : <input type={field.type === 'number' ? 'number' : field.format === 'email' ? 'email' : field.format === 'url' ? 'url' : 'text'} required={field.required} value={value as string | number ?? ''} min={field.min} max={field.max} step={field.integer ? 1 : 'any'} placeholder={field.example} onChange={(e) => change(e.target.value === '' ? undefined : field.type === 'number' ? e.target.valueAsNumber : e.target.value)} />}
    </label>
  })}</>
}
