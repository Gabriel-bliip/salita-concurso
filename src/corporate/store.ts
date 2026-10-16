import { useSyncExternalStore } from 'react'
import { createInitialState } from './mockData.ts'
import type { ActionResult, DemoState } from './types.ts'

// In-memory store shared by /empresa and /empleado during one browser session.
// Nothing is persisted or sent anywhere; a page reload restores the seed data.
let state: DemoState = createInitialState()
const listeners = new Set<() => void>()

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

// Applies a pure action from logic.ts; the state only changes when the action succeeds.
export function runAction(action: (current: DemoState) => ActionResult): ActionResult {
  const result = action(state)
  if (result.ok) {
    state = result.state
    listeners.forEach((listener) => listener())
  }
  return result
}

export function resetDemo() {
  state = createInitialState()
  listeners.forEach((listener) => listener())
}

export function setBookingEmployee(employeeId?: string) {
  return runAction((current) => {
    if (employeeId && !current.employees.some(({ id }) => id === employeeId)) {
      return { ok: false, error: 'Colaborador no encontrado.' }
    }
    return { ok: true, state: { ...current, bookingEmployeeId: employeeId } }
  })
}

export function useDemoState() {
  return useSyncExternalStore(subscribe, () => state)
}

// Hooks for the development-only two-session sync (see sync.ts, docs/demo-sync.md).
export const demoStoreAdapter = {
  get: () => state,
  subscribe,
  // Applies a state received from the other session; bookingEmployeeId stays local to each session.
  replace(next: DemoState) {
    state = { ...next, bookingEmployeeId: state.bookingEmployeeId }
    listeners.forEach((listener) => listener())
  },
}
