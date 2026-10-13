import { SearchX } from 'lucide-react'
import { useSearchParams } from 'react-router'
import Button from '../components/Button.tsx'
import CoworkCard from '../components/CoworkCard.tsx'
import CoworkFilters from '../components/CoworkFilters.tsx'
import { AMENITIES } from '../data/amenities.ts'
import { COMUNAS, COWORKS } from '../data/coworks.ts'
import type { AmenityId, Comuna } from '../types/index.ts'

const isComuna = (value: string | null): value is Comuna =>
  COMUNAS.includes(value as Comuna)

const isAmenityId = (value: string): value is AmenityId =>
  AMENITIES.some((amenity) => amenity.id === value)

function CoworksPage() {
  const [searchParams, setSearchParams] = useSearchParams()

  // Ignore unknown values so a hand-edited URL never breaks the page.
  const comunaParam = searchParams.get('comuna')
  const comuna = isComuna(comunaParam) ? comunaParam : null
  const amenityIds = (searchParams.get('amenities') ?? '').split(',').filter(isAmenityId)

  const filteredCoworks = COWORKS.filter(
    (cowork) =>
      (comuna === null || cowork.comuna === comuna) &&
      amenityIds.every((amenityId) => cowork.amenityIds.includes(amenityId)),
  )

  const updateFilters = (nextComuna: Comuna | null, nextAmenityIds: AmenityId[]) => {
    const params = new URLSearchParams()
    if (nextComuna) params.set('comuna', nextComuna)
    if (nextAmenityIds.length > 0) params.set('amenities', nextAmenityIds.join(','))
    setSearchParams(params, { replace: true })
  }

  const toggleAmenity = (amenityId: AmenityId) => {
    const nextAmenityIds = amenityIds.includes(amenityId)
      ? amenityIds.filter((id) => id !== amenityId)
      : [...amenityIds, amenityId]
    updateFilters(comuna, nextAmenityIds)
  }

  const clearFilters = () => updateFilters(null, [])

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
        Coworks en Santiago
      </h1>
      <p className="mt-2 text-slate-600">
        Reserva por hora, sin planes ni suscripciones. Filtra por comuna y servicios.
      </p>

      <div className="mt-10 grid gap-8 lg:grid-cols-[18rem_1fr]">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <CoworkFilters
            comuna={comuna}
            amenityIds={amenityIds}
            onComunaChange={(nextComuna) => updateFilters(nextComuna, amenityIds)}
            onAmenityToggle={toggleAmenity}
            onClear={clearFilters}
          />
        </aside>

        <section>
          <p className="text-sm text-slate-500" aria-live="polite">
            {filteredCoworks.length === 1
              ? '1 cowork encontrado'
              : `${filteredCoworks.length} coworks encontrados`}
          </p>

          {filteredCoworks.length > 0 ? (
            <div className="mt-4 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {filteredCoworks.map((cowork) => (
                <CoworkCard key={cowork.id} cowork={cowork} />
              ))}
            </div>
          ) : (
            <div className="mt-4 flex flex-col items-center rounded-2xl border border-dashed border-slate-300 px-6 py-16 text-center">
              <SearchX className="size-10 text-slate-400" aria-hidden />
              <p className="mt-4 font-medium text-slate-900">
                No hay coworks con esos filtros
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Prueba con otra comuna o quita algunos servicios.
              </p>
              <Button onClick={clearFilters} variant="secondary" className="mt-6">
                Limpiar filtros
              </Button>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

export default CoworksPage
