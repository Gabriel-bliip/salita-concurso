import type { LucideIcon } from 'lucide-react'
import {
  Bike,
  Coffee,
  Lock,
  PawPrint,
  Phone,
  Printer,
  SquareParking,
  Sun,
  Users,
  Wifi,
} from 'lucide-react'
import { AMENITY_LABELS } from '../data/amenities.ts'
import type { AmenityId } from '../types/index.ts'

const AMENITY_ICONS: Record<AmenityId, LucideIcon> = {
  wifi: Wifi,
  coffee: Coffee,
  'meeting-room': Users,
  'phone-booth': Phone,
  parking: SquareParking,
  'bike-parking': Bike,
  printer: Printer,
  lockers: Lock,
  terrace: Sun,
  'pet-friendly': PawPrint,
}

interface AmenityBadgeProps {
  amenityId: AmenityId
  compact?: boolean
}

function AmenityBadge({ amenityId, compact = false }: AmenityBadgeProps) {
  const Icon = AMENITY_ICONS[amenityId]
  const label = AMENITY_LABELS[amenityId]

  if (compact) {
    return (
      <span
        title={label}
        className="inline-flex size-8 items-center justify-center rounded-full bg-slate-100 text-slate-600"
      >
        <Icon className="size-4" aria-hidden />
        <span className="sr-only">{label}</span>
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-700">
      <Icon className="size-4 text-brand-700" aria-hidden />
      {label}
    </span>
  )
}

export default AmenityBadge
