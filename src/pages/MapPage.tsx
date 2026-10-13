import { useCallback } from 'react'
import { Link } from 'react-router'
import { MapPin } from 'lucide-react'
import CategoryBackLink from '../components/CategoryBackLink.tsx'
import ExplorationEmptyState from '../components/ExplorationEmptyState.tsx'
import CoworkMap from '../components/CoworkMap.tsx'
import CoworkFilters from '../components/CoworkFilters.tsx'
import { EMPTY_FILTERS } from '../lib/coworkFilters.ts'
import { useCategoryExploration } from '../lib/useCategoryExploration.ts'
import { MAP_CONFIG } from '../lib/mapConfig.ts'
import NotFoundPage from './NotFoundPage.tsx'

function MapPage() {
  const { category, filters, filterKey, locations: coworkers, hasLocations, updateFilters, params, setParams } = useCategoryExploration()
  const selectedSlug = coworkers.find((cowork) => cowork.slug === params.get('cowork'))?.slug ?? null
  const onSelect = useCallback((slug: string) => {
    setParams((previous) => {
      const next = new URLSearchParams(previous)
      next.set('cowork', slug)
      return next
    }, { replace: true })
  }, [setParams])

  if (!category) return <NotFoundPage message="Esta categoría no existe." />

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <CategoryBackLink />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-sm font-semibold text-primary">{category.name}</p>
          <h1 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">Encuentra tu espacio en el mapa</h1>
          <p className="mt-3 text-ink-muted">Explora Santiago y toca una burbuja para conocer el espacio.</p>
        </div>
        <Link to={`/espacios/${category.id}?${filterKey}`} className="text-sm font-semibold text-primary hover:underline">Ver listado de ubicaciones →</Link>
      </div>
      <div className="mt-8 grid gap-6 lg:grid-cols-[18rem_1fr]">
        <aside>
          <CoworkFilters category={category} filters={filters} onChange={updateFilters} />
        </aside>
        <section className="min-w-0">
          <p className="mb-3 text-sm text-ink-muted" aria-live="polite">{coworkers.length} {coworkers.length === 1 ? 'ubicación encontrada' : 'ubicaciones encontradas'}</p>
          {coworkers.length > 0 ? <CoworkMap coworkers={coworkers} selectedSlug={selectedSlug} onSelect={onSelect} /> : (
            <ExplorationEmptyState category={category} hasLocations={hasLocations} onClear={() => updateFilters(EMPTY_FILTERS)} />
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
                  <Link to={`/ubicaciones/${cowork.slug}`} className="font-semibold hover:underline">Ver espacio →</Link>
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
