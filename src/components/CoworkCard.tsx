import { MapPin } from 'lucide-react'
import { Link } from 'react-router'
import type { Cowork } from '../types/index.ts'
import AmenityBadge from './AmenityBadge.tsx'
import CoworkImage from './CoworkImage.tsx'

const MAX_VISIBLE_AMENITIES = 5

interface CoworkCardProps {
  cowork: Cowork
}

function CoworkCard({ cowork }: CoworkCardProps) {
  const visibleAmenities = cowork.amenityIds.slice(0, MAX_VISIBLE_AMENITIES)
  const hiddenCount = cowork.amenityIds.length - visibleAmenities.length

  return (
    <Link
      to={`/coworks/${cowork.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:-translate-y-0.5 hover:shadow-lg"
    >
      <CoworkImage cowork={cowork} className="aspect-[16/10] w-full" />
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div>
          <h3 className="font-semibold text-slate-900 group-hover:text-brand-700">{cowork.name}</h3>
          <p className="mt-1 flex items-center gap-1 text-sm text-slate-500">
            <MapPin className="size-4" aria-hidden />
            {cowork.comuna}
          </p>
        </div>
        <div className="mt-auto flex flex-wrap items-center gap-1.5">
          {visibleAmenities.map((amenityId) => (
            <AmenityBadge key={amenityId} amenityId={amenityId} compact />
          ))}
          {hiddenCount > 0 && <span className="text-xs text-slate-500">+{hiddenCount}</span>}
        </div>
      </div>
    </Link>
  )
}

export default CoworkCard
