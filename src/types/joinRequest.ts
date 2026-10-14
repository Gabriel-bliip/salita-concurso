import type { ComunaRM } from '../data/comunasRM.ts'
import type { SpaceType } from './space.ts'

// Exactly what the "Únete a nosotros" form sends. The backend should accept this shape
// and re-validate it with the same rules (src/lib/joinRequestValidation.ts).
export interface JoinRequestPayload {
  businessName: string
  contactName: string
  email: string
  // Normalized Chilean number: '+56' followed by 9 digits, e.g. '+56912345678'.
  phone: string | null
  comuna: ComunaRM
  spaceTypes: SpaceType[]
  message: string | null
  consentAccepted: true
  // Which version of the privacy text the user accepted.
  consentTextVersion: string
}

export type SubmitErrorCode = 'validation' | 'network' | 'server' | 'rate_limited' | 'unknown'

// The UI only reads `ok` and, on failure, shows `message` (always safe to display).
export type SubmitResult =
  | { ok: true }
  | { ok: false; code: SubmitErrorCode; message: string }
