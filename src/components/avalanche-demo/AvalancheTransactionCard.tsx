import { ShieldCheck } from 'lucide-react'
import type { SignerView } from './types.ts'

export const FUJI_NETWORK_LABEL = 'Avalanche Fuji Testnet'

export interface AvalancheTransactionCardProps {
  walletAddress: string // synthetic address
  txReference: string // synthetic reference, never a real hash
  signers: SignerView[]
  requiredSignatures: number
  title?: string
}

export function AvalancheTransactionCard({ walletAddress, txReference, signers, requiredSignatures, title = 'Registro en Avalanche' }: AvalancheTransactionCardProps) {
  const signed = signers.filter((signer) => signer.signed).length
  const reached = signed >= requiredSignatures
  return (
    <section aria-label={title} className="rounded-card border border-line bg-surface p-4 shadow-card sm:p-5">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-lg">{title}</h3>
        <span className="inline-flex rounded-full bg-primary px-2.5 py-0.5 text-xs font-semibold text-on-primary">Simulación</span>
      </header>
      <p className="mt-1 text-sm text-ink-muted">Red de referencia: {FUJI_NETWORK_LABEL} (sin conexión)</p>
      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <div className="min-w-0">
          <dt className="text-ink-muted">Billetera de demostración</dt>
          <dd className="font-mono font-semibold break-all">{walletAddress}</dd>
        </div>
        <div className="min-w-0">
          <dt className="text-ink-muted">Referencia (ficticia)</dt>
          <dd className="font-mono font-semibold break-all">{txReference}</dd>
        </div>
      </dl>
      <div className="mt-4 border-t border-line pt-4">
        <p className="flex items-center gap-2 text-sm font-semibold">
          <ShieldCheck aria-hidden className={`size-4 ${reached ? 'text-success' : 'text-ink-muted'}`} />
          Multifirma simulada: {signed} de {requiredSignatures} firmas
        </p>
        <ul className="mt-3 grid gap-2">
          {signers.map((signer) => (
            <li key={signer.wallet} data-signed={signer.signed} className="flex items-center justify-between gap-3 text-sm">
              <span>
                <span className="font-semibold">{signer.label}</span> <span className="font-mono text-xs text-ink-muted">{signer.wallet}</span>
              </span>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${signer.signed ? 'bg-primary-soft text-success' : 'bg-sunken text-ink-muted'}`}>
                {signer.signed ? 'Firma simulada' : 'Sin firmar'}
              </span>
            </li>
          ))}
        </ul>
      </div>
      <p className="mt-4 rounded-control bg-canvas px-3 py-2 text-xs text-ink-muted">Simulación para la demo: esta referencia no existe en la cadena ni representa una confirmación real.</p>
    </section>
  )
}
