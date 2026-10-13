import { MapPin } from 'lucide-react'
import { Link } from 'react-router'
import type { Cowork } from '../types/index.ts'
import AmenityBadge from './AmenityBadge.tsx'
import CoworkImage from './CoworkImage.tsx'

// Keeps the icons on a single row in the 3-column grid.
const MAX_VISIBLE_AMENITIES = 4

interface CoworkCardProps {
  cowork: Cowork
}

function CoworkCard({ cowork }: CoworkCardProps) {
  const visibleAmenities = cowork.amenityIds.slice(0, MAX_VISIBLE_AMENITIES)
  const hiddenCount = cowork.amenityIds.length - visibleAmenities.length

  return (
    <Link
      to={`/coworks/${cowork.slug}`}
      className="group flex flex-col overflow-hidden rounded-card border border-line bg-surface transition hover:-translate-y-0.5 hover:shadow-card"
    >
      <CoworkImage cowork={cowork} className="aspect-[16/10] w-full" />
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div>
          <h3 className="font-semibold text-ink group-hover:text-primary">{cowork.name}</h3>
          <p className="mt-1 flex items-center gap-1 text-sm text-ink-muted">
            <MapPin className="size-4" aria-hidden />
            {cowork.comuna}
          </p>
        </div>
        <div className="mt-auto flex flex-wrap items-center gap-1.5">
          {visibleAmenities.map((amenityId) => (
            <AmenityBadge key={amenityId} amenityId={amenityId} compact />
          ))}
          {hiddenCount > 0 && <span className="text-xs text-ink-muted">+{hiddenCount}</span>}
        </div>
      </div>
    </Link>
  )
}

export default CoworkCard
