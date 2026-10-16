// Props contracts for the Avalanche demo components. All data is synthetic and
// state lives in the parent: components only render and call back.

export type DemoRequestStatus = 'pending' | 'approved' | 'rejected'

export interface DemoSchedule {
  date: string // YYYY-MM-DD
  startHour: number
  hours: number
}

export interface DemoAllowance {
  limit: number // CLP cap for this employee
  spent: number // CLP already used
}

export interface ApprovalRequestView extends DemoSchedule {
  id: string
  employeeName: string
  employeeArea?: string
  spaceName: string
  amount: number // CLP total
  status: DemoRequestStatus
  note?: string
}

export interface SignerView {
  label: string
  wallet: string
  signed: boolean
}
