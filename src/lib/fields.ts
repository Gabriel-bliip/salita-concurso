import type { CategoryDefinition } from '../types/category.ts'

export interface FormField {
  label: string
  type: 'text' | 'number' | 'boolean' | 'select' | 'multiselect'
  required?: boolean
  options?: readonly { value: string; label: string }[]
  min?: number
  max?: number
  integer?: boolean
  example?: string
  format?: 'email' | 'phone' | 'url' | 'image'
}
export const option = (value: string, label = value) => ({ value, label })
export const text = (label: string, required = true, extra: Partial<FormField> = {}): FormField => ({ label, type: 'text', required, ...extra })
export const number = (label: string, min: number, max: number, integer = true): FormField => ({ label, type: 'number', required: true, min, max, integer })
export const choice = (label: string, options: NonNullable<FormField['options']>, required = true, multiple = false): FormField => ({ label, type: multiple ? 'multiselect' : 'select', options, required })

export function attributeFields(category: CategoryDefinition): Record<string, FormField> {
  return Object.fromEntries([
    ...(category.filters.attributes ?? []).filter((field) => !category.attributes?.some(({ id }) => id === field.id))
      .map((field) => [field.id, { ...field, type: 'multiselect' }]),
    ...(category.attributes ?? []).map((field) => [field.id, field]),
  ])
}

export function getFieldValue(value: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((current, key) => current && typeof current === 'object' ? (current as Record<string, unknown>)[key] : undefined, value)
}

export function setFieldValue<T extends object>(value: T, path: string, next: unknown): T {
  const result = structuredClone(value)
  const keys = path.split('.')
  if (keys.some((key) => ['__proto__', 'constructor', 'prototype'].includes(key))) throw new Error('Campo inválido.')
  let target = result as Record<string, unknown>
  for (const key of keys.slice(0, -1)) {
    if (!target[key] || typeof target[key] !== 'object') target[key] = {}
    target = target[key] as Record<string, unknown>
  }
  if (next === undefined) delete target[keys.at(-1)!]
  else target[keys.at(-1)!] = next
  return result
}

export function validateValue(value: unknown, field: FormField) {
  if (value === undefined || (Array.isArray(value) && !value.length)) {
    if (field.required) throw new Error('Este campo es obligatorio.')
    return
  }
  if (field.type === 'number') {
    if (typeof value !== 'number' || !Number.isFinite(value) || (field.integer && !Number.isSafeInteger(value)) ||
      value < (field.min ?? -Infinity) || value > (field.max ?? Infinity)) {
      throw new Error(`Ingresa un número ${field.integer ? 'entero ' : ''}entre ${field.min ?? '-∞'} y ${field.max ?? '∞'}.`)
    }
  } else if (field.type === 'boolean') {
    if (typeof value !== 'boolean') throw new Error('Responde sí o no.')
  } else if (field.type === 'select' || field.type === 'multiselect') {
    const values = field.type === 'multiselect' ? value : [value]
    if (!Array.isArray(values) || values.some((item) => !field.options?.some(({ value }) => value === item))) throw new Error('Elige únicamente opciones de la lista.')
  } else {
    if (typeof value !== 'string' || !value.trim()) throw new Error('Ingresa un texto no vacío.')
    if (field.format === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) throw new Error('Ingresa un correo válido, por ejemplo reservas@ejemplo.cl.')
    if (field.format === 'phone' && (!/^\+?[\d ()-]+$/.test(value) || value.replace(/\D/g, '').length < 8 || value.replace(/\D/g, '').length > 15)) throw new Error('Ingresa un teléfono de 8 a 15 dígitos; puede incluir +, espacios y guiones.')
    if (field.format === 'url' || field.format === 'image') {
      if (field.format === 'image' && /^\/(?!\/)[^\s?#]+$/.test(value) && !value.split('/').includes('..')) return
      try {
        const url = new URL(value)
        if (!['http:', 'https:'].includes(url.protocol) || !url.hostname || url.username || url.password) throw new Error()
      } catch { throw new Error('Usa una URL http:// o https:// válida, o /images/archivo.jpg para una foto local.') }
    }
  }
}

export function validateFields(values: unknown, fields: Record<string, FormField>) {
  for (const [key, field] of Object.entries(fields)) {
    try { validateValue(getFieldValue(values, key), field) }
    catch (error) { throw new Error(`${field.label}: ${(error as Error).message}`, { cause: error }) }
  }
}

export function validateImageReference(value: string) {
  if (value.startsWith('/')) {
    let decoded: string
    try { decoded = decodeURIComponent(value) } catch { throw new Error('Ruta de imagen inválida.') }
    if (!/^\/images\/[^\s?#\\]+\.(png|jpe?g|webp|gif|avif|svg)$/i.test(decoded) ||
        /[%?#\\\u0000-\u001f]/.test(decoded) || /%2f|%5c/i.test(value) ||
        decoded.split('/').slice(1).some((part) => !part || part === '.' || part === '..')) {
      throw new Error('Usa una ruta de imagen válida dentro de /images/, sin .. ni parámetros.')
    }
    return
  }
  validateValue(value, { label: 'Imagen', type: 'text', format: 'url', required: true })
  if (!value.startsWith('https://') || /\s|\\/.test(value)) throw new Error('La URL de la imagen debe usar HTTPS.')
}
