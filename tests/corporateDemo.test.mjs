import assert from 'node:assert/strict'
import test from 'node:test'
import { allowanceRemaining, approvalBlockedReason, approveRequest, createRequest, rejectRequest, setAllowance } from '../src/corporate/logic.ts'
import { resetDemo, runAction, setBookingEmployee } from '../src/corporate/store.ts'

function requestInput(changes = {}) {
  return {
    employeeId: 'e1', spaceId: 'test-unit', spaceName: 'Test Location · Test Room',
    locationSlug: 'test-location', date: '2026-11-02', startHour: 10, hours: 3,
    people: 4, pricePerHour: 10_000, amount: 30_000, ...changes,
  }
}

function fixture() {
  return {
    walletBalance: 1_000_000,
    employees: [
      { id: 'e1', name: 'Test One', area: 'A', wallet: '0x1', allowance: 100_000, spent: 40_000 },
      { id: 'e2', name: 'Test Two', area: 'B', wallet: '0x2', allowance: null, spent: 0 },
    ],
    requests: [
      { id: 'r1', employeeId: 'e1', spaceId: 'sp-1', date: '2026-11-01', startHour: 9, hours: 2, amount: 50_000, status: 'pending', createdAt: 'x' },
      { id: 'r2', employeeId: 'e1', spaceId: 'sp-1', date: '2026-11-01', startHour: 9, hours: 2, amount: 70_000, status: 'pending', createdAt: 'x' },
      { id: 'r3', employeeId: 'e2', spaceId: 'sp-1', date: '2026-11-01', startHour: 9, hours: 2, amount: 2_000_000, status: 'pending', createdAt: 'x' },
    ],
    transactions: [],
  }
}

test('approval debits wallet and allowance', () => {
  const result = approveRequest(fixture(), 'r1', 'admin')
  assert.ok(result.ok)
  assert.equal(result.state.walletBalance, 950_000)
  assert.equal(allowanceRemaining(result.state.employees[0]), 10_000)
  assert.equal(result.state.requests[0].status, 'approved')
})

test('approval over the spend cap or wallet balance is rejected', () => {
  assert.equal(approveRequest(fixture(), 'r2', 'admin').ok, false)
  assert.equal(approveRequest(fixture(), 'r3', 'admin').ok, false)
})

test('employee cannot approve, reject or change allowances', () => {
  assert.equal(approveRequest(fixture(), 'r1', 'employee').ok, false)
  assert.equal(rejectRequest(fixture(), 'r1', 'employee').ok, false)
  assert.equal(setAllowance(fixture(), 'e1', 500_000, 'employee').ok, false)
})

test('allowance can be removed but not set below spent amount', () => {
  assert.equal(setAllowance(fixture(), 'e1', 30_000, 'admin').ok, false)
  const removed = setAllowance(fixture(), 'e1', null, 'admin')
  assert.ok(removed.ok)
  assert.equal(allowanceRemaining(removed.state.employees[0]), null)
})

test('request amount is hours × price and a decided request cannot be decided again', () => {
  const created = createRequest(fixture(), requestInput())
  assert.ok(created.ok)
  assert.equal(created.state.requests[0].amount, 30_000)
  assert.equal(createRequest(fixture(), requestInput({ hours: 0 })).ok, false)
  const rejected = rejectRequest(fixture(), 'r1', 'admin')
  assert.ok(rejected.ok)
  assert.equal(approveRequest(rejected.state, 'r1', 'admin').ok, false)
})

test('marketplace request preserves the booking snapshot and displayed total across decisions', () => {
  const input = requestInput()
  const created = createRequest(fixture(), input)
  assert.ok(created.ok)
  const request = created.state.requests[0]
  for (const key of ['spaceId', 'spaceName', 'locationSlug', 'date', 'startHour', 'hours', 'amount', 'people']) {
    assert.equal(request[key], input[key])
  }
  assert.equal(request.status, 'pending')
  assert.equal(created.state.walletBalance, fixture().walletBalance)
  const approved = approveRequest(created.state, request.id, 'admin')
  assert.ok(approved.ok)
  assert.equal(approved.state.requests[0].status, 'approved')
  assert.equal(approved.state.transactions[0].label, `Aprobación simulada · ${input.spaceName}`)
  const rejected = rejectRequest(created.state, request.id, 'admin')
  assert.ok(rejected.ok)
  assert.equal(rejected.state.requests[0].status, 'rejected')
  assert.equal(rejected.state.walletBalance, created.state.walletBalance)
})

test('request rejects mismatched prices and invalid selections without changing state', () => {
  const state = fixture()
  const original = structuredClone(state)
  for (const changes of [
    { amount: 1 }, { employeeId: 'unknown' }, { spaceId: '' }, { locationSlug: '' },
    { date: 'invalid' }, { date: '2026-02-30' }, { startHour: 23 }, { hours: -1 },
    { people: 0 }, { pricePerHour: -1 }, { hours: 1.5 },
  ]) assert.equal(createRequest(state, requestInput(changes)).ok, false)
  assert.deepEqual(state, original)
  // Marketplace availability can allow more than the old standalone form's eight-hour limit.
  assert.equal(createRequest(state, requestInput({ employeeId: 'e2', hours: 9, amount: 90_000 })).ok, true)
})

test('booking and both portal actions use the same in-memory demo state', () => {
  resetDemo()
  assert.equal(setBookingEmployee('unknown').ok, false)
  assert.ok(setBookingEmployee('emp-1').ok)
  const submitted = runAction((state) => {
    assert.equal(state.bookingEmployeeId, 'emp-1')
    return createRequest(state, requestInput({ employeeId: state.bookingEmployeeId }))
  })
  assert.ok(submitted.ok)
  const id = submitted.state.requests[0].id
  assert.ok(runAction((state) => approveRequest(state, id, 'admin')).ok)
  runAction((state) => {
    assert.equal(state.requests.find((request) => request.id === id).status, 'approved')
    return { ok: true, state }
  })
  assert.ok(setBookingEmployee().ok)
  runAction((state) => {
    assert.equal(state.bookingEmployeeId, undefined)
    assert.equal(state.requests.find((request) => request.id === id).status, 'approved')
    return { ok: true, state }
  })
  resetDemo()
})

test('submission respects the optional allowance and approval rechecks changed limits', () => {
  const state = fixture()
  const overCap = requestInput({ hours: 7, amount: 70_000 })
  assert.equal(createRequest(state, overCap).ok, false)
  const uncapped = createRequest(state, { ...overCap, employeeId: 'e2' })
  assert.ok(uncapped.ok)
  const request = uncapped.state.requests[0]
  assert.equal(approvalBlockedReason(uncapped.state, request), undefined)
  const approved = approveRequest(uncapped.state, request.id, 'admin')
  assert.ok(approved.ok)
  assert.equal(approved.state.employees[1].allowance, null)
  assert.equal(approved.state.employees[1].spent, 70_000)
  assert.equal(approved.state.walletBalance, state.walletBalance - 70_000)

  const limited = setAllowance(uncapped.state, 'e2', 60_000, 'admin')
  assert.ok(limited.ok)
  assert.ok(approvalBlockedReason(limited.state, request))
  assert.equal(approveRequest(limited.state, request.id, 'admin').ok, false)
  const rejected = rejectRequest(limited.state, request.id, 'admin')
  assert.ok(rejected.ok)
  assert.equal(rejected.state.walletBalance, state.walletBalance)
  assert.equal(rejected.state.transactions.length, 0)
})

test('pending requests change balances once on approval and never on rejection', () => {
  const initial = fixture()
  const submitted = createRequest(initial, requestInput())
  const id = submitted.state.requests[0].id
  const approved = approveRequest(submitted.state, id, 'admin')
  assert.equal(approved.state.requests[0].reviewedAt, 'Ahora')
  assert.equal(approved.state.transactions.length, 1)
  assert.equal(approveRequest(approved.state, id, 'admin').ok, false)
  assert.equal(rejectRequest(approved.state, id, 'admin').ok, false)
  const rejected = rejectRequest(submitted.state, id, 'admin')
  assert.equal(rejected.state.requests[0].reviewedAt, 'Ahora')
  assert.deepEqual(rejected.state.employees, initial.employees)
  assert.deepEqual(rejected.state.transactions, initial.transactions)
})
