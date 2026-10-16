// Corporate demo model. All data is synthetic and lives in memory only.

export type Role = 'admin' | 'employee'
export type RequestStatus = 'pending' | 'approved' | 'rejected'
export interface Employee {
  id: string
  name: string
  area: string
  wallet: string // synthetic, shortened address
  allowance: number | null // CLP cap; null = no individual allowance
  spent: number // CLP already approved against the allowance
}

export interface BookingRequest {
  id: string
  employeeId: string
  spaceId: string
  spaceName: string // snapshot of the selected location and reservable unit
  locationSlug?: string // omitted for synthetic seed history
  people?: number
  date: string // YYYY-MM-DD
  startHour: number
  hours: number
  amount: number // CLP = hours × price per hour
  status: RequestStatus
  note?: string // reason shown when rejected
  createdAt: string // display label
  reviewedAt?: string // simulated decision label, not a chain timestamp
}

export interface Signer {
  id: string
  label: string
  wallet: string
  role: string
}

export interface Transaction {
  id: string
  kind: 'booking' | 'deposit' | 'allowance'
  label: string
  amount: number // CLP, negative = outflow
  date: string
  employeeId?: string
}

export interface DemoState {
  bookingEmployeeId?: string // undefined selects the individual booking experience
  walletBalance: number // CLP equivalent held by the simulated corporate wallet
  employees: Employee[]
  requests: BookingRequest[]
  transactions: Transaction[]
}

export type ActionResult = { ok: true; state: DemoState } | { ok: false; error: string }
