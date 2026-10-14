import type { JoinRequestPayload, SubmitResult } from '../types/joinRequest.ts'

// Future endpoint. Set VITE_API_BASE_URL in a local .env (see .env.example).
// This version does NOT call the network: the request below is simulated.
const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL ?? ''
export const JOIN_REQUESTS_ENDPOINT = `${API_BASE_URL.replace(/\/$/, '')}/join-requests`

// Demo trigger: this email makes the mock fail so the error state can be shown.
export const MOCK_ERROR_EMAIL = 'error@ejemplo.cl'

const MOCK_DELAY_MS = 800

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// Sends a join request. Never throws: every outcome resolves to a typed SubmitResult.
//
// When the backend exists, replace the mock body with something like:
//   const response = await fetch(JOIN_REQUESTS_ENDPOINT, {
//     method: 'POST',
//     headers: { 'Content-Type': 'application/json' },
//     body: JSON.stringify(payload),
//   })
// and map network failures and non-2xx statuses to the error codes below,
// keeping `message` safe to show to the user.
export async function submitJoinRequest(payload: JoinRequestPayload): Promise<SubmitResult> {
  try {
    await wait(MOCK_DELAY_MS)
    if (payload.email === MOCK_ERROR_EMAIL) {
      return {
        ok: false,
        code: 'server',
        message: 'No pudimos enviar tu solicitud. Inténtalo de nuevo en unos minutos.',
      }
    }
    return { ok: true }
  } catch {
    return {
      ok: false,
      code: 'unknown',
      message: 'Ocurrió un problema inesperado. Inténtalo de nuevo.',
    }
  }
}
