import type { ApprovalRequestView, DemoAllowance, SignerView } from './types.ts'

// Synthetic data for visual testing. Names and addresses are fictitious.
export const DEMO_COMPANY_NAME = 'Empresa Demo SpA'
export const DEMO_EMPLOYEE_NAME = 'Valentina Demo'
export const DEMO_WALLET_ADDRESS = '0x71C0…9A3e'
export const DEMO_TX_REFERENCE = 'SIM-0xA1b2…f3C4'

export const DEMO_ALLOWANCE: DemoAllowance = { limit: 150_000, spent: 30_000 }

export const DEMO_MODAL_BOOKING = {
  spaceName: 'Sala Los Leones (8 personas)',
  date: '2026-10-22',
  startHour: 10,
  hours: 3,
  total: 84_000,
}

export const DEMO_APPROVAL_REQUESTS: ApprovalRequestView[] = [
  { id: 'demo-1', employeeName: 'Bruno Ejemplo', employeeArea: 'Ventas', spaceName: 'Sala Los Leones (8 personas)', date: '2026-10-22', startHour: 10, hours: 3, amount: 84_000, status: 'pending' },
  { id: 'demo-2', employeeName: 'Carla Muestra', employeeArea: 'Ingeniería', spaceName: 'Cowork Plaza Italia', date: '2026-10-19', startHour: 9, hours: 6, amount: 45_000, status: 'approved' },
  { id: 'demo-3', employeeName: 'Diego Prueba', employeeArea: 'Operaciones', spaceName: 'Sala Sanhattan (12 personas)', date: '2026-10-14', startHour: 15, hours: 2, amount: 84_000, status: 'rejected', note: 'Fuera del presupuesto del trimestre.' },
]

export const DEMO_SIGNERS: SignerView[] = [
  { label: 'Tesorería', wallet: '0x51A0…c3D1', signed: true },
  { label: 'Finanzas', wallet: '0x9eF2…07B4', signed: true },
  { label: 'Gerencia', wallet: '0x3b7C…e8F9', signed: false },
]
