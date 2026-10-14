import { CircleCheck } from 'lucide-react'
import type { FormEvent } from 'react'
import { useEffect, useRef, useState } from 'react'
import Button from '../components/Button.tsx'
import Checkbox from '../components/form/Checkbox.tsx'
import FieldError from '../components/form/FieldError.tsx'
import SelectField from '../components/form/SelectField.tsx'
import TextAreaField from '../components/form/TextAreaField.tsx'
import TextField from '../components/form/TextField.tsx'
import { COMUNAS_RM } from '../data/comunasRM.ts'
import type { JoinField, JoinRequestValues } from '../lib/joinRequestValidation.ts'
import {
  EMPTY_JOIN_VALUES,
  JOIN_FIELDS,
  JOIN_LIMITS,
  toJoinRequestPayload,
  validateJoinRequest,
} from '../lib/joinRequestValidation.ts'
import { SPACE_TYPE_LABELS, SPACE_TYPES } from '../lib/spaces.ts'
import { submitJoinRequest } from '../services/joinRequests.ts'
import type { SpaceType } from '../types/space.ts'

// Field labels for the error summary, in the same words the form uses.
const FIELD_LABELS: Record<JoinField, string> = {
  businessName: 'Nombre comercial',
  contactName: 'Nombre de contacto',
  email: 'Correo electrónico',
  phone: 'Teléfono',
  comuna: 'Comuna',
  spaceTypes: 'Tipo de espacio',
  message: 'Mensaje',
  consentAccepted: 'Autorización de contacto',
}

// id of the element each summary link should move focus to.
const FIELD_TARGETS: Record<JoinField, string> = {
  businessName: 'businessName',
  contactName: 'contactName',
  email: 'email',
  phone: 'phone',
  comuna: 'comuna',
  spaceTypes: `spaceType-${SPACE_TYPES[0]}`,
  message: 'message',
  consentAccepted: 'consentAccepted',
}

const SPACE_TYPE_HINTS: Record<SpaceType, string> = {
  coworking: 'Escritorios en una zona compartida',
  meeting_room: 'Salas para reuniones por hora',
  office_box: 'Oficinas privadas para 2 a 6 personas',
}

type Status = 'idle' | 'submitting' | 'success' | 'error'

function JoinPage() {
  const [values, setValues] = useState<JoinRequestValues>(EMPTY_JOIN_VALUES)
  const [touched, setTouched] = useState<Partial<Record<JoinField, boolean>>>({})
  const [submitAttempts, setSubmitAttempts] = useState(0)
  const [status, setStatus] = useState<Status>('idle')
  const [submitError, setSubmitError] = useState<string | null>(null)
  // Honeypot: hidden from people, often filled in by bots.
  const [website, setWebsite] = useState('')

  const summaryRef = useRef<HTMLDivElement>(null)
  const successRef = useRef<HTMLHeadingElement>(null)
  const submitErrorRef = useRef<HTMLDivElement>(null)

  const errors = validateJoinRequest(values)
  const errorFields = JOIN_FIELDS.filter((field) => errors[field])
  const visibleError = (field: JoinField) =>
    touched[field] || submitAttempts > 0 ? (errors[field] ?? null) : null

  const setValue = <K extends JoinField>(field: K, value: JoinRequestValues[K]) =>
    setValues((current) => ({ ...current, [field]: value }))
  const touch = (field: JoinField) => setTouched((current) => ({ ...current, [field]: true }))

  // Move focus to the error summary after a failed submit, and to the thanks heading on success.
  useEffect(() => {
    if (submitAttempts > 0) summaryRef.current?.focus()
  }, [submitAttempts])
  // The submit button is disabled while sending, so focus would otherwise fall back to <body>.
  useEffect(() => {
    if (status === 'success') successRef.current?.focus()
    if (status === 'error') submitErrorRef.current?.focus()
  }, [status])

  const send = async () => {
    setStatus('submitting')
    setSubmitError(null)
    const result = await submitJoinRequest(toJoinRequestPayload(values))
    if (result.ok) {
      setStatus('success')
    } else {
      setStatus('error')
      setSubmitError(result.message)
    }
  }

  // Used by both the submit button and "Reintentar", so a retry is validated again.
  const trySubmit = () => {
    if (status === 'submitting') return
    if (errorFields.length > 0) {
      setSubmitAttempts((count) => count + 1)
      return
    }
    // A filled honeypot means a bot: pretend it worked without sending anything.
    if (website) {
      setStatus('success')
      return
    }
    void send()
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    trySubmit()
  }

  const toggleSpaceType = (type: SpaceType, checked: boolean) => {
    setValue(
      'spaceTypes',
      checked ? [...values.spaceTypes, type] : values.spaceTypes.filter((item) => item !== type),
    )
    touch('spaceTypes')
  }

  if (status === 'success') {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center sm:px-6">
        <CircleCheck className="size-12 text-success" aria-hidden />
        <h1 ref={successRef} tabIndex={-1} className="mt-4 text-3xl font-bold tracking-tight text-ink">
          ¡Gracias por escribirnos!
        </h1>
        <p className="mt-4 text-ink-muted">
          Recibimos tus datos y los revisaremos para conversar sobre cómo sumar tu espacio a Salita.
        </p>
        <Button to="/" className="mt-8">
          Volver al inicio
        </Button>
      </div>
    )
  }

  const spaceTypesError = visibleError('spaceTypes')
  const consentError = visibleError('consentAccepted')
  const showSummary = submitAttempts > 0 && errorFields.length > 0

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">Únete a Salita</h1>
      <p className="mt-3 text-ink-muted">
        ¿Tienes un cowork, oficinas o salas de reuniones en Santiago? Déjanos tus datos y
        conversemos sobre cómo sumar tu espacio a la plataforma.
      </p>

      <div
        ref={summaryRef}
        tabIndex={-1}
        aria-live="polite"
        className={showSummary ? 'mt-8 rounded-card border-2 border-danger bg-surface p-5' : 'sr-only'}
      >
        {showSummary && (
          <>
            <h2 className="text-lg font-semibold text-ink">
              Revisa {errorFields.length === 1 ? 'este campo' : `estos ${errorFields.length} campos`}
            </h2>
            <ul className="mt-3 flex flex-col gap-1.5 text-sm">
              {errorFields.map((field) => (
                <li key={field}>
                  <a
                    href={`#${FIELD_TARGETS[field]}`}
                    onClick={(event) => {
                      event.preventDefault()
                      document.getElementById(FIELD_TARGETS[field])?.focus()
                    }}
                    className="font-medium text-danger underline underline-offset-2"
                  >
                    {FIELD_LABELS[field]}: {errors[field]}
                  </a>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      <form noValidate onSubmit={handleSubmit} className="mt-8 flex flex-col gap-6">
        <TextField
          id="businessName"
          label="Nombre comercial del espacio"
          autoComplete="organization"
          maxLength={JOIN_LIMITS.nameMaxLength}
          value={values.businessName}
          onChange={(value) => setValue('businessName', value)}
          onBlur={() => touch('businessName')}
          error={visibleError('businessName')}
        />
        <TextField
          id="contactName"
          label="Nombre y apellido de contacto"
          autoComplete="name"
          maxLength={JOIN_LIMITS.nameMaxLength}
          value={values.contactName}
          onChange={(value) => setValue('contactName', value)}
          onBlur={() => touch('contactName')}
          error={visibleError('contactName')}
        />
        <TextField
          id="email"
          type="email"
          label="Correo electrónico"
          autoComplete="email"
          maxLength={JOIN_LIMITS.emailMaxLength}
          value={values.email}
          onChange={(value) => setValue('email', value)}
          onBlur={() => touch('email')}
          error={visibleError('email')}
        />
        <TextField
          id="phone"
          type="tel"
          label="Teléfono"
          hint="Formato +56 9 1234 5678"
          optional
          autoComplete="tel"
          value={values.phone}
          onChange={(value) => setValue('phone', value)}
          onBlur={() => touch('phone')}
          error={visibleError('phone')}
        />
        <SelectField
          id="comuna"
          label="Comuna del espacio"
          placeholder="Elige una comuna"
          options={COMUNAS_RM}
          value={values.comuna}
          onChange={(value) => setValue('comuna', value)}
          onBlur={() => touch('comuna')}
          error={visibleError('comuna')}
        />

        <fieldset aria-describedby={spaceTypesError ? 'spaceTypes-error' : undefined}>
          <legend className="text-sm font-semibold text-ink">Tipo de espacio</legend>
          <p className="mt-1 text-sm text-ink-muted">Marca todos los que ofreces.</p>
          <div className="mt-3 flex flex-col gap-3">
            {SPACE_TYPES.map((type) => (
              <Checkbox
                key={type}
                id={`spaceType-${type}`}
                checked={values.spaceTypes.includes(type)}
                invalid={Boolean(spaceTypesError)}
                onChange={(checked) => toggleSpaceType(type, checked)}
              >
                {SPACE_TYPE_LABELS[type]}
                <span className="block text-sm text-ink-muted">{SPACE_TYPE_HINTS[type]}</span>
              </Checkbox>
            ))}
          </div>
          <div className="mt-2">
            <FieldError id="spaceTypes-error" message={spaceTypesError} live={false} />
          </div>
        </fieldset>

        <TextAreaField
          id="message"
          label="Cuéntanos sobre tu espacio"
          hint="Por ejemplo, cuántos puestos o salas tienes y qué servicios ofreces."
          optional
          maxLength={JOIN_LIMITS.messageMaxLength}
          value={values.message}
          onChange={(value) => setValue('message', value)}
          onBlur={() => touch('message')}
          error={visibleError('message')}
        />

        {/* Honeypot: off-screen and skipped by keyboard and screen readers. */}
        <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
          <label htmlFor="website">No completes este campo</label>
          <input
            id="website"
            name="website"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={website}
            onChange={(event) => setWebsite(event.target.value)}
          />
        </div>

        <div className="rounded-card border border-line bg-surface p-5">
          <Checkbox
            id="consentAccepted"
            checked={values.consentAccepted}
            invalid={Boolean(consentError)}
            describedBy={['privacy-note', consentError ? 'consentAccepted-error' : null].filter(Boolean).join(' ')}
            onChange={(checked) => {
              setValue('consentAccepted', checked)
              touch('consentAccepted')
            }}
          >
            Acepto que Salita me contacte para conversar sobre sumar mi espacio a la plataforma y
            que trate los datos que entrego en este formulario.
          </Checkbox>
          {/* PROVISIONAL LEGAL TEXT — must be reviewed before launch (privacy policy not written yet). */}
          <p id="privacy-note" className="mt-3 pl-8 text-xs text-ink-muted">
            Usaremos tus datos solo para contactarte sobre tu incorporación a Salita. No los
            compartiremos con terceros. Puedes pedir que los eliminemos escribiéndonos.
          </p>
          <div className="mt-2 pl-8">
            <FieldError id="consentAccepted-error" message={consentError} live={false} />
          </div>
        </div>

        {status === 'error' && submitError && (
          <div ref={submitErrorRef} tabIndex={-1} role="alert" className="flex flex-col gap-3 rounded-card border-2 border-danger bg-surface p-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-medium text-danger">{submitError}</p>
            <Button onClick={trySubmit} variant="secondary">
              Reintentar
            </Button>
          </div>
        )}

        <Button type="submit" disabled={status === 'submitting'} className="sm:self-start">
          {status === 'submitting' ? 'Enviando…' : 'Enviar mis datos'}
        </Button>
      </form>
    </div>
  )
}

export default JoinPage
