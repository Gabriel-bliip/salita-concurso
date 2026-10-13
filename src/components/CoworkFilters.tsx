import { AMENITIES } from '../data/amenities.ts'
import { COMUNAS } from '../data/coworks.ts'
import type { CoworkFilterState } from '../lib/coworkFilters.ts'
import { EMPTY_FILTERS, hasActiveFilters, PEOPLE_OPTIONS } from '../lib/coworkFilters.ts'
import { SPACE_TYPE_LABELS, SPACE_TYPES } from '../lib/spaces.ts'
import type { Comuna } from '../types/index.ts'
import Chip from './Chip.tsx'

interface CoworkFiltersProps {
  filters: CoworkFilterState
  onChange: (filters: CoworkFilterState) => void
}

const selectClass =
  'mt-2 w-full rounded-control border border-line-strong bg-surface px-3 py-2 text-sm text-ink focus:border-primary'

function CoworkFilters({ filters, onChange }: CoworkFiltersProps) {
  const update = (changes: Partial<CoworkFilterState>) => onChange({ ...filters, ...changes })

  return (
    <div className="flex flex-col gap-6 rounded-card border border-line bg-surface p-5">
      <fieldset>
        <legend className="text-sm font-semibold text-ink">Tipo de espacio</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          <Chip selected={filters.spaceType === null} onClick={() => update({ spaceType: null })}>
            Todos
          </Chip>
          {SPACE_TYPES.map((type) => (
            <Chip
              key={type}
              selected={filters.spaceType === type}
              onClick={() => update({ spaceType: type })}
            >
              {SPACE_TYPE_LABELS[type]}
            </Chip>
          ))}
        </div>
      </fieldset>

      <div>
        <label htmlFor="people" className="text-sm font-semibold text-ink">
          Personas
        </label>
        <select
          id="people"
          value={filters.people ?? ''}
          onChange={(event) => update({ people: Number(event.target.value) || null })}
          className={selectClass}
        >
          <option value="">Cualquier cantidad</option>
          {PEOPLE_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option === 1 ? '1 persona' : `${option} personas o más`}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="comuna" className="text-sm font-semibold text-ink">
          Comuna
        </label>
        <select
          id="comuna"
          value={filters.comuna ?? ''}
          onChange={(event) => update({ comuna: (event.target.value || null) as Comuna | null })}
          className={selectClass}
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
            const selected = filters.amenityIds.includes(amenity.id)
            return (
              <Chip
                key={amenity.id}
                selected={selected}
                onClick={() =>
                  update({
                    amenityIds: selected
                      ? filters.amenityIds.filter((id) => id !== amenity.id)
                      : [...filters.amenityIds, amenity.id],
                  })
                }
              >
                {amenity.label}
              </Chip>
            )
          })}
        </div>
      </fieldset>

      {hasActiveFilters(filters) && (
        <button
          type="button"
          onClick={() => onChange(EMPTY_FILTERS)}
          className="self-start text-sm font-medium text-primary hover:text-primary-hover"
        >
          Limpiar filtros
        </button>
      )}
    </div>
  )
}

export default CoworkFilters
