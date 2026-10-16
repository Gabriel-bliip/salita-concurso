import { useState } from 'react'
import Button from '../Button.tsx'
import { ApprovalCard } from './ApprovalCard.tsx'
import { AvalancheTransactionCard } from './AvalancheTransactionCard.tsx'
import { BookingRequestModal } from './BookingRequestModal.tsx'
import { BookingStatusTimeline } from './BookingStatusTimeline.tsx'
import {
  DEMO_ALLOWANCE,
  DEMO_APPROVAL_REQUESTS,
  DEMO_COMPANY_NAME,
  DEMO_EMPLOYEE_NAME,
  DEMO_MODAL_BOOKING,
  DEMO_SIGNERS,
  DEMO_TX_REFERENCE,
  DEMO_WALLET_ADDRESS,
} from './fixtures.ts'

// Visual test bench: renders every component with fixtures. Not routed anywhere.
export function AvalancheDemoGallery() {
  const [open, setOpen] = useState(false)
  const [requests, setRequests] = useState(DEMO_APPROVAL_REQUESTS)
  const decide = (id: string, status: 'approved' | 'rejected') => setRequests((list) => list.map((item) => (item.id === id ? { ...item, status } : item)))

  return (
    <div className="mx-auto grid max-w-4xl gap-6 p-6">
      <Button onClick={() => setOpen(true)} className="justify-self-start">
        Abrir solicitud
      </Button>
      <BookingRequestModal
        open={open}
        {...DEMO_MODAL_BOOKING}
        employeeName={DEMO_EMPLOYEE_NAME}
        companyName={DEMO_COMPANY_NAME}
        allowance={DEMO_ALLOWANCE}
        onSubmit={() => setOpen(false)}
        onCancel={() => setOpen(false)}
      />
      <div className="grid gap-4 md:grid-cols-3">
        {requests.map((request) => (
          <ApprovalCard key={request.id} request={request} onApprove={(id) => decide(id, 'approved')} onReject={(id) => decide(id, 'rejected')} />
        ))}
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <BookingStatusTimeline status="approved" completed submittedAt="Hoy, 09:12" reviewedAt="Hoy, 10:05" completedAt="Hoy, 10:06" />
        <AvalancheTransactionCard walletAddress={DEMO_WALLET_ADDRESS} txReference={DEMO_TX_REFERENCE} signers={DEMO_SIGNERS} requiredSignatures={2} />
      </div>
    </div>
  )
}
