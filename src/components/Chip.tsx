import type { ReactNode } from 'react'

interface ChipProps {
  children: ReactNode
  selected: boolean
  onClick: () => void
}

// Toggle button styled as a pill; `aria-pressed` exposes the state to screen readers.
function Chip({ children, selected, onClick }: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-sm transition-colors ${
        selected ? 'bg-primary text-on-primary' : 'bg-sunken text-ink hover:bg-primary-soft'
      }`}
    >
      {children}
    </button>
  )
}

export default Chip
