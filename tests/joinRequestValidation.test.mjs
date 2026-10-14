import assert from 'node:assert/strict'
import test from 'node:test'
import { COMUNAS_RM } from '../src/data/comunasRM.ts'
import {
  EMPTY_JOIN_VALUES,
  JOIN_LIMITS,
  normalizeChileanPhone,
  toJoinRequestPayload,
  validateJoinField,
  validateJoinRequest,
} from '../src/lib/joinRequestValidation.ts'
import { MOCK_ERROR_EMAIL, submitJoinRequest } from '../src/services/joinRequests.ts'

const VALID = {
  businessName: '  Casa Lastarria ',
  contactName: 'Ana Pérez',
  email: ' Ana@Ejemplo.CL ',
  phone: '+56 9 1234 5678',
  comuna: 'Providencia',
  spaceTypes: ['office_box', 'coworking'],
  message: '',
  consentAccepted: true,
}

test('the Región Metropolitana list has its 52 communes, without duplicates', () => {
  assert.equal(COMUNAS_RM.length, 52)
  assert.equal(new Set(COMUNAS_RM).size, 52)
})

test('an empty form reports every required field and nothing for optional ones', () => {
  const errors = validateJoinRequest(EMPTY_JOIN_VALUES)
  assert.deepEqual(Object.keys(errors).sort(), ['businessName', 'comuna', 'consentAccepted', 'contactName', 'email', 'spaceTypes'])
})

test('a valid form has no errors and builds a normalized payload', () => {
  assert.deepEqual(validateJoinRequest(VALID), {})
  assert.deepEqual(toJoinRequestPayload(VALID), {
    businessName: 'Casa Lastarria',
    contactName: 'Ana Pérez',
    email: 'ana@ejemplo.cl',
    phone: '+56912345678',
    comuna: 'Providencia',
    spaceTypes: ['coworking', 'office_box'],
    message: null,
    consentAccepted: true,
    consentTextVersion: 'provisional-2026-10',
  })
})

test('Chilean phones are accepted in common formats and normalized', () => {
  for (const input of ['+56 9 1234 5678', '+56912345678', '56912345678', '9 1234 5678', '912345678', '+56 2 2345 6789', '(+56) 9-1234-5678']) {
    assert.ok(normalizeChileanPhone(input), input)
  }
  for (const input of ['12345', '+54 9 1234 5678', '+56 1 2345 6789', '91234567', 'abc']) {
    assert.equal(normalizeChileanPhone(input), null, input)
  }
})

test('field rules give Spanish messages for invalid values', () => {
  const check = (field, changes) => validateJoinField(field, { ...VALID, ...changes })
  assert.match(check('email', { email: 'ana@ejemplo' }), /formato/)
  assert.match(check('comuna', { comuna: 'Santiago Centro' }), /comuna/)
  assert.match(check('spaceTypes', { spaceTypes: ['estadio'] }), /tipo de espacio/)
  assert.match(check('message', { message: 'x'.repeat(JOIN_LIMITS.messageMaxLength + 1) }), /hasta 400/)
  assert.equal(check('phone', { phone: '' }), null)
})

test('the mock service resolves a typed result and never throws', async () => {
  const payload = toJoinRequestPayload(VALID)
  assert.deepEqual(await submitJoinRequest(payload), { ok: true })
  const failure = await submitJoinRequest({ ...payload, email: MOCK_ERROR_EMAIL })
  assert.equal(failure.ok, false)
  assert.equal(failure.code, 'server')
  assert.equal(typeof failure.message, 'string')
})
