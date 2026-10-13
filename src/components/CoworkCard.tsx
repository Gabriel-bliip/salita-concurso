import { MapPin } from 'lucide-react'
import { Link } from 'react-router'
import { formatClp } from '../lib/format.ts'
import { getLowestPrice, SPACE_TYPE_LABELS, SPACE_TYPES } from '../lib/spaces.ts'
import type { Cowork } from '../types/index.ts'
import type { Space } from '../types/space.ts'
import AmenityBadge from './AmenityBadge.tsx'
import CoworkImage from './CoworkImage.tsx'

// Keeps the icons on a single row in the 3-column grid.
const MAX_VISIBLE_AMENITIES = 4

interface CoworkCardProps {
  cowork: Cowork
  // Spaces to summarize (e.g. only those matching the active filters).
  spaces?: Space[]
}

function CoworkCard({ cowork, spaces = cowork.spaces }: CoworkCardProps) {
  const visibleAmenities = cowork.amenityIds.slice(0, MAX_VISIBLE_AMENITIES)
  const hiddenCount = cowork.amenityIds.length - visibleAmenities.length
  const spaceTypes = SPACE_TYPES.filter((type) => spaces.some((space) => space.type === type))

  return (
    <Link
      to={`/ubicaciones/${cowork.slug}`}
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
        <p className="text-sm text-ink-muted">
          {spaceTypes.map((type) => SPACE_TYPE_LABELS[type]).join(' · ')}
        </p>
        <div className="flex flex-wrap items-center gap-1.5">
          {visibleAmenities.map((amenityId) => (
            <AmenityBadge key={amenityId} amenityId={amenityId} compact />
          ))}
          {hiddenCount > 0 && <span className="text-xs text-ink-muted">+{hiddenCount}</span>}
        </div>
        {spaces.length > 0 ? <p className="mt-auto border-t border-line pt-3 text-sm text-ink-muted">
          Desde{' '}
          <span className="text-lg font-semibold text-primary">
            {formatClp(getLowestPrice(spaces))}
          </span>{' '}
          por hora
        </p> : <p className="mt-auto border-t border-line pt-3 text-sm text-ink-muted">Sin espacios reservables por ahora</p>}
      </div>
    </Link>
  )
}

export default CoworkCard
