import type { ReactNode } from 'react'
import { Link } from 'react-router'

type Variant = 'primary' | 'secondary'

const variantClasses: Record<Variant, string> = {
  primary: 'bg-primary text-on-primary hover:bg-primary-hover',
  secondary: 'bg-surface text-primary ring-1 ring-line-strong ring-inset hover:bg-primary-soft',
}

interface ButtonProps {
  children: ReactNode
  to?: string
  onClick?: () => void
  variant?: Variant
  className?: string
  disabled?: boolean
}

function Button({
  children,
  to,
  onClick,
  variant = 'primary',
  className = '',
  disabled = false,
}: ButtonProps) {
  const classes = `inline-flex items-center justify-center gap-2 rounded-control px-5 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:bg-sunken disabled:text-ink-muted disabled:ring-0 ${variantClasses[variant]} ${className}`

  if (to) {
    return (
      <Link to={to} className={classes}>
        {children}
      </Link>
    )
  }

  return (
    <button type="button" onClick={onClick} disabled={disabled} className={classes}>
      {children}
    </button>
  )
}

export default Button
