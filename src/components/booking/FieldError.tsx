import { CircleAlert } from 'lucide-react'

// Validation message announced to screen readers as soon as it appears.
function FieldError({ message }: { message: string | null }) {
  return (
    <p role="alert" className="flex items-start gap-2 text-sm font-medium text-danger empty:hidden">
      {message && (
        <>
          <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
          {message}
        </>
      )}
    </p>
  )
}

export default FieldError
