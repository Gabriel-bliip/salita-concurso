// Validation rules for "Únete a nosotros" join requests.
// Plain functions with no React or browser APIs, so the future backend can import
// this file and apply exactly the same rules to the payload it receives.
import { COMUNAS_RM } from '../data/comunasRM.ts'
import type { JoinRequestPayload } from '../types/joinRequest.ts'
import type { SpaceType } from '../types/space.ts'
import { SPACE_TYPES } from './spaces.ts'

export const JOIN_LIMITS = {
  nameMaxLength: 120,
  emailMaxLength: 254,
  messageMaxLength: 400,
}

// Bump when the privacy text shown next to the consent checkbox changes.
export const CONSENT_TEXT_VERSION = 'provisional-2026-10'

// Raw values as typed in the form (also what the backend gets after mapping nulls to '').
export interface JoinRequestValues {
  businessName: string
  contactName: string
  email: string
  phone: string
  comuna: string
  spaceTypes: string[]
  message: string
  consentAccepted: boolean
}

export type JoinField = keyof JoinRequestValues
export type JoinErrors = Partial<Record<JoinField, string>>

// Display order, used for the error summary.
export const JOIN_FIELDS: JoinField[] = [
  'businessName',
  'contactName',
  'email',
  'phone',
  'comuna',
  'spaceTypes',
  'message',
  'consentAccepted',
]

export const EMPTY_JOIN_VALUES: JoinRequestValues = {
  businessName: '',
  contactName: '',
  email: '',
  phone: '',
  comuna: '',
  spaceTypes: [],
  message: '',
  consentAccepted: false,
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

// Accepts '+56 9 1234 5678', '56912345678', '912345678', '+56 2 2345 6789' (spaces,
// dashes, dots and parentheses allowed). Returns '+56XXXXXXXXX', or null if invalid.
export function normalizeChileanPhone(input: string) {
  let digits = input.replace(/[\s\-().]/g, '')
  if (digits.startsWith('+56')) digits = digits.slice(3)
  else if (digits.startsWith('56') && digits.length === 11) digits = digits.slice(2)
  return /^[2-9]\d{8}$/.test(digits) ? `+56${digits}` : null
}

const isSpaceType = (value: string): value is SpaceType =>
  SPACE_TYPES.some((type) => type === value)

// Returns a Spanish, user-facing message, or null when the field is valid.
export function validateJoinField(field: JoinField, values: JoinRequestValues): string | null {
  switch (field) {
    case 'businessName': {
      const value = values.businessName.trim()
      if (!value) return 'Escribe el nombre comercial de tu espacio.'
      if (value.length > JOIN_LIMITS.nameMaxLength) {
        return `El nombre comercial puede tener hasta ${JOIN_LIMITS.nameMaxLength} caracteres.`
      }
      return null
    }
    case 'contactName': {
      const value = values.contactName.trim()
      if (value.length < 3) return 'Escribe el nombre completo de la persona de contacto.'
      if (value.length > JOIN_LIMITS.nameMaxLength) {
        return `El nombre puede tener hasta ${JOIN_LIMITS.nameMaxLength} caracteres.`
      }
      return null
    }
    case 'email': {
      const value = values.email.trim()
      if (!value) return 'Escribe un correo electrónico.'
      if (value.length > JOIN_LIMITS.emailMaxLength || !EMAIL_PATTERN.test(value)) {
        return 'Revisa el correo: debe tener el formato nombre@dominio.cl.'
      }
      return null
    }
    case 'phone':
      if (!values.phone.trim()) return null
      return normalizeChileanPhone(values.phone)
        ? null
        : 'Revisa el teléfono: usa el formato +56 9 1234 5678.'
    case 'comuna':
      return COMUNAS_RM.some((comuna) => comuna === values.comuna)
        ? null
        : 'Elige la comuna donde está el espacio.'
    case 'spaceTypes':
      return values.spaceTypes.length > 0 && values.spaceTypes.every(isSpaceType)
        ? null
        : 'Elige al menos un tipo de espacio.'
    case 'message': {
      const length = values.message.trim().length
      return length > JOIN_LIMITS.messageMaxLength
        ? `El mensaje puede tener hasta ${JOIN_LIMITS.messageMaxLength} caracteres (tiene ${length}).`
        : null
    }
    case 'consentAccepted':
      return values.consentAccepted ? null : 'Debes aceptar para que podamos contactarte.'
  }
}

export function validateJoinRequest(values: JoinRequestValues): JoinErrors {
  const errors: JoinErrors = {}
  for (const field of JOIN_FIELDS) {
    const error = validateJoinField(field, values)
    if (error) errors[field] = error
  }
  return errors
}

// Builds the payload to send. Only call it when validateJoinRequest returned no errors.
export function toJoinRequestPayload(values: JoinRequestValues): JoinRequestPayload {
  const message = values.message.trim()
  return {
    businessName: values.businessName.trim(),
    contactName: values.contactName.trim(),
    email: values.email.trim().toLowerCase(),
    phone: values.phone.trim() ? normalizeChileanPhone(values.phone) : null,
    comuna: COMUNAS_RM.find((comuna) => comuna === values.comuna)!,
    spaceTypes: SPACE_TYPES.filter((type) => values.spaceTypes.includes(type)),
    message: message || null,
    consentAccepted: true,
    consentTextVersion: CONSENT_TEXT_VERSION,
  }
}
