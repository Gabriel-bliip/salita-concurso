import { useCallback, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router'
import { MapPin, SearchX } from 'lucide-react'
import CoworkMap from '../components/CoworkMap.tsx'
import CoworkFilters from '../components/CoworkFilters.tsx'
import { COWORKS } from '../data/coworks.ts'
import type { CoworkFilterState } from '../lib/coworkFilters.ts'
import { EMPTY_FILTERS, filterCoworks, filtersToParams, parseFilters } from '../lib/coworkFilters.ts'
import { MAP_CONFIG } from '../lib/mapConfig.ts'

function MapPage() {
  const [params, setParams] = useSearchParams()
  const filters = parseFilters(params)
  // Keyed by the normalized filter string so the map only rebuilds markers when filters change.
  const filterKey = filtersToParams(filters).toString()
  const coworkers = useMemo(() => filterCoworks(COWORKS, parseFilters(new URLSearchParams(filterKey))).map(({ cowork }) => cowork), [filterKey])
  const selectedSlug = coworkers.find((cowork) => cowork.slug === params.get('cowork'))?.slug ?? null
  const onSelect = useCallback((slug: string) => {
    setParams((previous) => {
      const next = new URLSearchParams(previous)
      next.set('cowork', slug)
      return next
    }, { replace: true })
  }, [setParams])

  const updateFilters = (next: CoworkFilterState) => setParams(filtersToParams(next), { replace: true })

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-sm font-semibold text-primary">Ubicaciones</p>
          <h1 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">Encuentra tu cowork en el mapa</h1>
          <p className="mt-3 text-ink-muted">Explora Santiago y toca una burbuja para conocer el espacio.</p>
        </div>
        <Link to={`/coworks?${filterKey}`} className="text-sm font-semibold text-primary hover:underline">Ver listado de coworks →</Link>
      </div>
      <div className="mt-8 grid gap-6 lg:grid-cols-[18rem_1fr]">
        <aside>
          <CoworkFilters filters={filters} onChange={updateFilters} />
        </aside>
        <section className="min-w-0">
          <p className="mb-3 text-sm text-ink-muted" aria-live="polite">{coworkers.length} {coworkers.length === 1 ? 'ubicación encontrada' : 'ubicaciones encontradas'}</p>
          {coworkers.length > 0 ? <CoworkMap coworkers={coworkers} selectedSlug={selectedSlug} onSelect={onSelect} /> : (
            <div className="flex min-h-72 flex-col items-center justify-center rounded-card border border-dashed border-line-strong p-6 text-center">
              <SearchX className="size-10 text-ink-muted" aria-hidden />
              <p className="mt-4 font-semibold">No hay coworks con esos filtros</p>
              <button onClick={() => updateFilters(EMPTY_FILTERS)} className="mt-4 text-primary underline">Limpiar filtros</button>
            </div>
          )}
          <div className="mt-5 grid gap-3 sm:grid-cols-2" aria-label="Lugares del mapa">
            {coworkers.map((cowork) => (
              <article key={cowork.id} className={`rounded-card border p-4 ${selectedSlug === cowork.slug ? 'border-primary bg-primary-soft' : 'border-line'}`}>
                <button onClick={() => onSelect(cowork.slug)} className="flex w-full items-center gap-3 text-left" aria-pressed={selectedSlug === cowork.slug} aria-label={`Mostrar ${cowork.name} en el mapa`}>
                  <img src={cowork.images[0] || MAP_CONFIG.fallbackCover} alt="" className="size-12 shrink-0 rounded-full object-cover" onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = MAP_CONFIG.fallbackCover }} />
                  <span><span className="block font-semibold text-ink">{cowork.name}</span><span className="mt-1 block text-xs text-ink-muted">{cowork.address}</span></span>
                </button>
                <div className="mt-3 flex items-center justify-between gap-2 text-xs text-primary">
                  <span className="flex items-center gap-1"><MapPin className="size-3" aria-hidden />{cowork.comuna}</span>
                  <Link to={`/coworks/${cowork.slug}`} className="font-semibold hover:underline">Ver cowork →</Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

export default MapPage
