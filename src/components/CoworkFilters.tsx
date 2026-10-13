import { AMENITIES } from '../data/amenities.ts'
import { COMUNAS } from '../data/coworks.ts'
import type { AmenityId, Comuna } from '../types/index.ts'

interface CoworkFiltersProps {
  comuna: Comuna | null
  amenityIds: AmenityId[]
  onComunaChange: (comuna: Comuna | null) => void
  onAmenityToggle: (amenityId: AmenityId) => void
  onClear: () => void
}

function CoworkFilters({
  comuna,
  amenityIds,
  onComunaChange,
  onAmenityToggle,
  onClear,
}: CoworkFiltersProps) {
  const hasFilters = comuna !== null || amenityIds.length > 0

  return (
    <div className="flex flex-col gap-6 rounded-card border border-line bg-surface p-5">
      <div>
        <label htmlFor="comuna" className="text-sm font-semibold text-ink">
          Comuna
        </label>
        <select
          id="comuna"
          value={comuna ?? ''}
          onChange={(event) => onComunaChange((event.target.value || null) as Comuna | null)}
          className="mt-2 w-full rounded-control border border-line-strong bg-surface px-3 py-2 text-sm text-ink focus:border-primary"
        >
          <option value="">Todas las comunas</option>
          {COMUNAS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      <fieldset>
        <legend className="text-sm font-semibold text-ink">Servicios</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {AMENITIES.map((amenity) => {
            const selected = amenityIds.includes(amenity.id)
            return (
              <button
                key={amenity.id}
                type="button"
                aria-pressed={selected}
                onClick={() => onAmenityToggle(amenity.id)}
                className={`rounded-full px-3 py-1.5 text-sm transition-colors ${
                  selected
                    ? 'bg-primary text-on-primary'
                    : 'bg-sunken text-ink hover:bg-primary-soft'
                }`}
              >
                {amenity.label}
              </button>
            )
          })}
        </div>
      </fieldset>

      {hasFilters && (
        <button
          type="button"
          onClick={onClear}
          className="self-start text-sm font-medium text-primary hover:text-primary-hover"
        >
          Limpiar filtros
        </button>
      )}
    </div>
  )
}

export default CoworkFilters
