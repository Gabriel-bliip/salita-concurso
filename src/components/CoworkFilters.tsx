import { AMENITIES } from '../data/amenities.ts'
import type { Category } from '../data/categories.ts'
import { COWORK_CATEGORY } from '../data/categories.ts'
import type { CoworkFilterState } from '../lib/coworkFilters.ts'
import { EMPTY_FILTERS, getCategoryComunas, hasActiveFilters } from '../lib/coworkFilters.ts'
import { SPACE_TYPE_LABELS } from '../lib/spaces.ts'
import type { Comuna } from '../types/index.ts'
import Chip from './Chip.tsx'

interface CoworkFiltersProps {
  filters: CoworkFilterState
  onChange: (filters: CoworkFilterState) => void
  category?: Category
}

const selectClass =
  'mt-2 w-full rounded-control border border-line-strong bg-surface px-3 py-2 text-sm text-ink focus:border-primary'

function CoworkFilters({ filters, onChange, category = COWORK_CATEGORY }: CoworkFiltersProps) {
  const update = (changes: Partial<CoworkFilterState>) => onChange({ ...filters, ...changes })
  const config = category.filters
  const comunas = getCategoryComunas(category)
  const amenities = AMENITIES.filter(({ id }) => config.amenityIds?.includes(id))

  return (
    <div className="flex flex-col gap-6 rounded-card border border-line bg-surface p-5">
      {!!config.spaceTypes?.length && <fieldset>
        <legend className="text-sm font-semibold text-ink">Tipo de espacio</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          <Chip selected={filters.spaceType === null} onClick={() => update({ spaceType: null })}>
            Todos
          </Chip>
          {config.spaceTypes.map((type) => (
            <Chip
              key={type}
              selected={filters.spaceType === type}
              onClick={() => update({ spaceType: type })}
            >
              {SPACE_TYPE_LABELS[type]}
            </Chip>
          ))}
        </div>
      </fieldset>}

      {!!config.people?.length && <div>
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
          {filters.people !== null && !config.people.includes(filters.people) && (
            <option value={filters.people}>{filters.people} personas o más</option>
          )}
          {config.people.map((option) => (
            <option key={option} value={option}>
              {option === 1 ? '1 persona' : `${option} personas o más`}
            </option>
          ))}
        </select>
      </div>}

      {config.comuna && <div>
        <label htmlFor="comuna" className="text-sm font-semibold text-ink">
          Comuna
        </label>
        <select
          id="comuna"
          disabled={comunas.length === 0}
          value={filters.comuna ?? ''}
          onChange={(event) => update({ comuna: (event.target.value || null) as Comuna | null })}
          className={selectClass}
        >
          <option value="">Todas las comunas</option>
          {comunas.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        {comunas.length === 0 && <p className="mt-2 text-xs text-ink-muted">Las comunas estarán disponibles cuando haya ubicaciones.</p>}
      </div>}

      {amenities.length > 0 && <fieldset>
        <legend className="text-sm font-semibold text-ink">Servicios</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {amenities.map((amenity) => {
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
      </fieldset>}

      {config.attributes?.map((filter) => (
        <fieldset key={filter.id}>
          <legend className="text-sm font-semibold text-ink">{filter.label}</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {filter.options.map(({ value, label }) => {
              const values = filters.attributes?.[filter.id] ?? []
              const selected = values.includes(value)
              return (
                <Chip key={value} selected={selected} onClick={() => update({
                  attributes: {
                    ...filters.attributes,
                    [filter.id]: selected ? values.filter((item) => item !== value) : [...values, value],
                  },
                })}>
                  {label}
                </Chip>
              )
            })}
          </div>
        </fieldset>
      ))}

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
