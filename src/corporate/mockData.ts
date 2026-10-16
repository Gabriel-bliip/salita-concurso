import type { DemoState, Signer } from './types.ts'

// PROVISIONAL: the budget token denomination is still an open decision.
export const CLP_PER_USDC = 950

// PROVISIONAL: requests at or above this amount are flagged as needing multisig.
export const MULTISIG_THRESHOLD = 150_000
export const MULTISIG_REQUIRED = 2

export const COMPANY_NAME = 'Empresa Demo SpA'
export const COMPANY_WALLET = '0xC0DE…5A11'
export const CURRENT_EMPLOYEE_ID = 'emp-1'

export const SIGNERS: Signer[] = [
  { id: 'sg-1', label: 'Tesorería', wallet: '0x51A0…c3D1', role: 'Administración (tú)' },
  { id: 'sg-2', label: 'Finanzas', wallet: '0x9eF2…07B4', role: 'Co-firmante' },
  { id: 'sg-3', label: 'Gerencia', wallet: '0x3b7C…e8F9', role: 'Co-firmante' },
]

export function createInitialState(): DemoState {
  return {
    walletBalance: 14_250_000,
    employees: [
      { id: 'emp-1', name: 'Valentina Demo', area: 'Producto', wallet: '0x71C0…9A3e', allowance: 120_000, spent: 63_000 },
      { id: 'emp-2', name: 'Bruno Ejemplo', area: 'Ventas', wallet: '0xB2d4…11Fa', allowance: 200_000, spent: 150_000 },
      { id: 'emp-3', name: 'Carla Muestra', area: 'Ingeniería', wallet: '0xD93a…4c20', allowance: null, spent: 84_000 },
      { id: 'emp-4', name: 'Diego Prueba', area: 'Operaciones', wallet: '0xE480…b7C6', allowance: 60_000, spent: 12_000 },
    ],
    requests: [
      { id: 'rq-1', employeeId: 'emp-2', spaceId: 'sp-3', spaceName: 'Sala Los Leones (8 personas)', date: '2026-10-22', startHour: 10, hours: 3, amount: 84_000, status: 'pending', createdAt: 'Hoy, 09:12' },
      { id: 'rq-2', employeeId: 'emp-3', spaceId: 'sp-4', spaceName: 'Sala Sanhattan (12 personas)', date: '2026-10-23', startHour: 14, hours: 4, amount: 168_000, status: 'pending', createdAt: 'Hoy, 08:40' },
      { id: 'rq-3', employeeId: 'emp-4', spaceId: 'sp-1', spaceName: 'Cowork Bellavista Norte', date: '2026-10-21', startHour: 9, hours: 8, amount: 48_000, status: 'pending', createdAt: 'Ayer, 17:05' },
      { id: 'rq-4', employeeId: 'emp-1', spaceId: 'sp-2', spaceName: 'Cowork Plaza Italia', date: '2026-10-19', startHour: 9, hours: 6, amount: 45_000, status: 'approved', createdAt: '12 oct, 11:30' },
      { id: 'rq-5', employeeId: 'emp-1', spaceId: 'sp-3', spaceName: 'Sala Los Leones (8 personas)', date: '2026-10-14', startHour: 15, hours: 2, amount: 56_000, status: 'rejected', note: 'Fuera del presupuesto del trimestre.', createdAt: '8 oct, 16:20' },
      { id: 'rq-6', employeeId: 'emp-1', spaceId: 'sp-1', spaceName: 'Cowork Bellavista Norte', date: '2026-10-09', startHour: 9, hours: 3, amount: 18_000, status: 'approved', createdAt: '2 oct, 10:02' },
    ],
    transactions: [
      { id: 'tx-1', kind: 'booking', label: 'Reserva · Cowork Plaza Italia', amount: -45_000, date: '12 oct, 11:31', employeeId: 'emp-1' },
      { id: 'tx-2', kind: 'booking', label: 'Reserva · Cowork Bellavista Norte', amount: -18_000, date: '2 oct, 10:03', employeeId: 'emp-1' },
      { id: 'tx-3', kind: 'deposit', label: 'Depósito de presupuesto mensual', amount: 5_000_000, date: '1 oct, 09:00' },
      { id: 'tx-4', kind: 'allowance', label: 'Asignación individual · Diego Prueba', amount: 0, date: '30 sep, 18:10', employeeId: 'emp-4' },
    ],
  }
}
