import { SearchX } from 'lucide-react'
import { useSearchParams } from 'react-router'
import Button from '../components/Button.tsx'
import CoworkCard from '../components/CoworkCard.tsx'
import CoworkFilters from '../components/CoworkFilters.tsx'
import { COWORKS } from '../data/coworks.ts'
import type { CoworkFilterState } from '../lib/coworkFilters.ts'
import { EMPTY_FILTERS, filterCoworks, filtersToParams, parseFilters } from '../lib/coworkFilters.ts'

function CoworksPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const filters = parseFilters(searchParams)
  const results = filterCoworks(COWORKS, filters)

  const updateFilters = (next: CoworkFilterState) =>
    setSearchParams(filtersToParams(next), { replace: true })

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
        Coworks en Santiago
      </h1>
      <p className="mt-2 text-ink-muted">
        Reserva por hora, sin planes ni suscripciones. Filtra por tipo de espacio, personas,
        comuna y servicios.
      </p>
      <Button to={`/mapa?${filtersToParams(filters)}`} variant="secondary" className="mt-5">
        Ver ubicaciones en el mapa
      </Button>

      <div className="mt-10 grid gap-8 lg:grid-cols-[18rem_1fr]">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <CoworkFilters filters={filters} onChange={updateFilters} />
        </aside>

        <section>
          <p className="text-sm text-ink-muted" aria-live="polite">
            {results.length === 1 ? '1 cowork encontrado' : `${results.length} coworks encontrados`}
          </p>

          {results.length > 0 ? (
            <div className="mt-4 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {results.map(({ cowork, spaces }) => (
                <CoworkCard key={cowork.id} cowork={cowork} spaces={spaces} />
              ))}
            </div>
          ) : (
            <div className="mt-4 flex flex-col items-center rounded-card border border-dashed border-line-strong px-6 py-16 text-center">
              <SearchX className="size-10 text-ink-muted" aria-hidden />
              <p className="mt-4 font-medium text-ink">No hay coworks con esos filtros</p>
              <p className="mt-1 text-sm text-ink-muted">
                Prueba con otro tipo de espacio, menos personas u otra comuna.
              </p>
              <Button onClick={() => updateFilters(EMPTY_FILTERS)} variant="secondary" className="mt-6">
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
