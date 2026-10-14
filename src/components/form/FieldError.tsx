import { CircleAlert } from 'lucide-react'

interface FieldErrorProps {
  message: string | null
  id?: string
  // Announce as soon as it appears. Form fields turn this off: their errors are
  // linked with aria-describedby and announced by the form's error summary instead.
  live?: boolean
}

function FieldError({ message, id, live = true }: FieldErrorProps) {
  return (
    <p
      id={id}
      role={live ? 'alert' : undefined}
      className="flex items-start gap-2 text-sm font-medium text-danger empty:hidden"
    >
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
