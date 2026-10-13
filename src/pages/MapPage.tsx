import { useCallback, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router'
import { MapPin, SearchX } from 'lucide-react'
import CoworkMap from '../components/CoworkMap.tsx'
import CoworkFilters from '../components/CoworkFilters.tsx'
import { COWORKS, COMUNAS } from '../data/coworks.ts'
import { AMENITIES } from '../data/amenities.ts'
import type { AmenityId, Comuna } from '../types/index.ts'

function MapPage() {
  const [params, setParams] = useSearchParams()
  const comuna = COMUNAS.find((value) => value === params.get('comuna')) ?? null
  const amenitiesParam = params.get('amenities') ?? ''
  const amenityIds = useMemo(() => AMENITIES.filter((amenity) => amenitiesParam.split(',').includes(amenity.id)).map((amenity) => amenity.id), [amenitiesParam])
  const coworkers = useMemo(() => COWORKS.filter((cowork) => (!comuna || cowork.comuna === comuna) && amenityIds.every((id) => cowork.amenityIds.includes(id))), [comuna, amenityIds])
  const selectedSlug = coworkers.find((cowork) => cowork.slug === params.get('cowork'))?.slug ?? null
  const onSelect = useCallback((slug: string) => {
    setParams((previous) => {
      const next = new URLSearchParams(previous)
      next.set('cowork', slug)
      return next
    }, { replace: true })
  }, [setParams])

  const updateFilters = (nextComuna: Comuna | null, nextAmenities: AmenityId[]) => {
    const next = new URLSearchParams()
    if (nextComuna) next.set('comuna', nextComuna)
    if (nextAmenities.length) next.set('amenities', nextAmenities.join(','))
    setParams(next, { replace: true })
  }
  const listParams = new URLSearchParams(params)
  listParams.delete('cowork')

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-sm font-semibold text-brand-700">Ubicaciones</p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Encuentra tu cowork en el mapa</h1>
          <p className="mt-3 text-slate-600">Explora Santiago y toca una burbuja para conocer el espacio.</p>
        </div>
        <Link to={`/coworks?${listParams}`} className="text-sm font-semibold text-brand-700 hover:underline">Ver listado de coworks →</Link>
      </div>
      <div className="mt-8 grid gap-6 lg:grid-cols-[18rem_1fr]">
        <aside>
          <CoworkFilters comuna={comuna} amenityIds={amenityIds}
            onComunaChange={(value) => updateFilters(value, amenityIds)}
            onAmenityToggle={(id) => updateFilters(comuna, amenityIds.includes(id) ? amenityIds.filter((value) => value !== id) : [...amenityIds, id])}
            onClear={() => updateFilters(null, [])} />
        </aside>
        <section className="min-w-0">
          <p className="mb-3 text-sm text-slate-500" aria-live="polite">{coworkers.length} {coworkers.length === 1 ? 'ubicación encontrada' : 'ubicaciones encontradas'}</p>
          {coworkers.length > 0 ? <CoworkMap coworkers={coworkers} selectedSlug={selectedSlug} onSelect={onSelect} /> : (
            <div className="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 p-6 text-center">
              <SearchX className="size-10 text-slate-400" aria-hidden />
              <p className="mt-4 font-semibold">No hay coworks con esos filtros</p>
              <button onClick={() => updateFilters(null, [])} className="mt-4 text-brand-700 underline">Limpiar filtros</button>
            </div>
          )}
          <div className="mt-5 grid gap-3 sm:grid-cols-2" aria-label="Lugares del mapa">
            {coworkers.map((cowork) => (
              <article key={cowork.id} className={`rounded-xl border p-4 ${selectedSlug === cowork.slug ? 'border-brand-600 bg-brand-50' : 'border-slate-200'}`}>
                <button onClick={() => onSelect(cowork.slug)} className="flex w-full items-center gap-3 text-left" aria-pressed={selectedSlug === cowork.slug} aria-label={`Mostrar ${cowork.name} en el mapa`}>
                  <img src={cowork.images[0] || '/cowork-placeholder.svg'} alt="" className="size-12 shrink-0 rounded-full object-cover" onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = '/cowork-placeholder.svg' }} />
                  <span><span className="block font-semibold text-slate-900">{cowork.name}</span><span className="mt-1 block text-xs text-slate-500">{cowork.address}</span></span>
                </button>
                <div className="mt-3 flex items-center justify-between gap-2 text-xs text-brand-700">
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
