import assert from 'node:assert/strict'
import test, { after, before } from 'node:test'
import { createServer } from 'vite'
import react from '@vitejs/plugin-react'

// Components are hook-free, so we expand them into plain host elements and
// inspect/click them without a browser or DOM library.
let server
let demo
before(async () => {
  server = await createServer({ plugins: [react()], server: { middlewareMode: true, hmr: false, watch: null }, appType: 'custom', logLevel: 'silent', optimizeDeps: { noDiscovery: true } })
  demo = await server.ssrLoadModule('/src/components/avalanche-demo/index.ts')
})
after(async () => {
  await server.close()
})

function expand(node) {
  if (node == null || typeof node === 'boolean') return []
  if (typeof node === 'string' || typeof node === 'number') return [String(node)]
  if (Array.isArray(node)) return node.flatMap(expand)
  const { type, props } = node
  if (typeof type === 'function') return expand(type(props))
  if (typeof type === 'string') return [{ type, props, children: expand(props.children) }]
  return expand(props.children)
}

function text(nodes) {
  return nodes.map((n) => (typeof n === 'string' ? n : text(n.children))).join('')
}

function find(nodes, predicate) {
  return nodes.flatMap((n) => (typeof n === 'string' ? [] : [...(predicate(n) ? [n] : []), ...find(n.children, predicate)]))
}

const button = (tree, label) => find(tree, (n) => n.type === 'button' && text(n.children).includes(label))[0]

const [pending, approved, rejected] = [0, 1, 2]
const request = (index) => ({ ...(demo.DEMO_APPROVAL_REQUESTS[index]) })

test('ApprovalCard buttons call the provided callbacks with the request id', () => {
  const calls = []
  const tree = expand(demo.ApprovalCard({ request: request(pending), onApprove: (id) => calls.push(['approve', id]), onReject: (id) => calls.push(['reject', id]) }))
  button(tree, 'Aprobar').props.onClick()
  button(tree, 'Rechazar').props.onClick()
  assert.deepEqual(calls, [['approve', 'demo-1'], ['reject', 'demo-1']])
})

test('ApprovalCard hides controls once decided and shows the status', () => {
  for (const [index, label] of [[approved, 'Aprobada'], [rejected, 'Rechazada']]) {
    const tree = expand(demo.ApprovalCard({ request: request(index), onApprove() {}, onReject() {} }))
    assert.equal(button(tree, 'Aprobar'), undefined)
    assert.equal(button(tree, 'Rechazar'), undefined)
    assert.ok(text(tree).includes(label))
  }
})

test('ApprovalCard disables approval when blocked', () => {
  const tree = expand(demo.ApprovalCard({ request: request(pending), onApprove() {}, onReject() {}, blockedReason: 'Supera el tope.' }))
  assert.equal(button(tree, 'Aprobar').props.disabled, true)
  assert.equal(button(tree, 'Rechazar').props.disabled, false)
  assert.ok(text(tree).includes('Supera el tope.'))
})

const modalProps = (changes = {}) => ({ open: true, ...demo.DEMO_MODAL_BOOKING, employeeName: 'Ana Test', companyName: 'Test SpA', onSubmit() {}, onCancel() {}, ...changes })

test('BookingRequestModal renders nothing when closed and wires both actions', () => {
  assert.equal(demo.BookingRequestModal(modalProps({ open: false })), null)
  const calls = []
  const tree = expand(demo.BookingRequestModal(modalProps({ allowance: demo.DEMO_ALLOWANCE, onSubmit: () => calls.push('submit'), onCancel: () => calls.push('cancel') })))
  button(tree, 'Solicitar aprobación').props.onClick()
  button(tree, 'Cancelar').props.onClick()
  assert.deepEqual(calls, ['submit', 'cancel'])
  const content = text(tree)
  for (const expected of ['Sala Los Leones', 'Ana Test', 'Test SpA', '3 horas', 'Asignación disponible']) assert.ok(content.includes(expected), expected)
})

test('BookingRequestModal blocks submit over the allowance and omits the indicator without one', () => {
  const over = expand(demo.BookingRequestModal(modalProps({ allowance: { limit: 100_000, spent: 50_000 } })))
  assert.equal(button(over, 'Solicitar aprobación').props.disabled, true)
  assert.ok(text(over).includes('Supera tu asignación'))
  const none = expand(demo.BookingRequestModal(modalProps({ allowance: null })))
  assert.equal(button(none, 'Solicitar aprobación').props.disabled, false)
  assert.equal(find(none, (n) => n.props.role === 'progressbar').length, 0)
})

test('BookingRequestModal closes on Escape', () => {
  let cancelled = 0
  const root = demo.BookingRequestModal(modalProps({ onCancel: () => cancelled++ }))
  root.props.onKeyDown({ key: 'Enter' })
  root.props.onKeyDown({ key: 'Escape' })
  assert.equal(cancelled, 1)
})

const states = (props) => find(expand(demo.BookingStatusTimeline(props)), (n) => n.type === 'li').map((n) => n.props['data-state'])

test('BookingStatusTimeline distinguishes pending, approved, completed and rejected', () => {
  assert.deepEqual(states({ status: 'pending' }), ['done', 'current', 'upcoming', 'upcoming'])
  assert.deepEqual(states({ status: 'approved' }), ['done', 'done', 'done', 'upcoming'])
  assert.deepEqual(states({ status: 'approved', completed: true }), ['done', 'done', 'done', 'done'])
  assert.deepEqual(states({ status: 'rejected', completed: true }), ['done', 'done', 'rejected', 'skipped'])
})

test('AvalancheTransactionCard labels the simulation, network and signature count', () => {
  const tree = expand(demo.AvalancheTransactionCard({ walletAddress: '0xTEST', txReference: 'SIM-1', signers: demo.DEMO_SIGNERS, requiredSignatures: 2 }))
  const content = text(tree)
  for (const expected of ['Simulación', 'Avalanche Fuji Testnet', '0xTEST', 'SIM-1', '2 de 2 firmas', 'Sin firmar']) assert.ok(content.includes(expected), expected)
  assert.equal(find(tree, (n) => n.type === 'a').length, 0)
  const partial = text(expand(demo.AvalancheTransactionCard({ walletAddress: 'a', txReference: 'b', signers: demo.DEMO_SIGNERS.map((s) => ({ ...s, signed: false })), requiredSignatures: 2 })))
  assert.ok(partial.includes('0 de 2 firmas'))
})
