import CategoryBackLink from '../components/CategoryBackLink.tsx'
import ExplorationEmptyState from '../components/ExplorationEmptyState.tsx'
import Button from '../components/Button.tsx'
import CoworkCard from '../components/CoworkCard.tsx'
import CoworkFilters from '../components/CoworkFilters.tsx'
import { EMPTY_FILTERS } from '../lib/coworkFilters.ts'
import { useCategoryExploration } from '../lib/useCategoryExploration.ts'
import NotFoundPage from './NotFoundPage.tsx'

function CoworksPage() {
  const { category, filters, filterKey, results, hasLocations, updateFilters } = useCategoryExploration()
  if (!category) return <NotFoundPage message="Esta categoría no existe." />

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <CategoryBackLink />
      <h1 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
        {category.id === 'cowork' ? 'Coworks en Santiago' : category.name}
      </h1>
      <p className="mt-2 text-ink-muted">
        Reserva por hora, sin planes ni suscripciones. Explora las ubicaciones de esta categoría.
      </p>
      <Button to={`/espacios/${category.id}/mapa?${filterKey}`} variant="secondary" className="mt-5">
        Ver ubicaciones en el mapa
      </Button>

      <div className="mt-10 grid gap-8 lg:grid-cols-[18rem_1fr]">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <CoworkFilters category={category} filters={filters} onChange={updateFilters} />
        </aside>

        <section>
          <p className="text-sm text-ink-muted" aria-live="polite">
            {results.length === 1 ? '1 ubicación encontrada' : `${results.length} ubicaciones encontradas`}
          </p>

          {results.length > 0 ? (
            <div className="mt-4 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {results.map(({ cowork, spaces }) => (
                <CoworkCard key={cowork.id} cowork={cowork} spaces={spaces} />
              ))}
            </div>
          ) : (
            <ExplorationEmptyState category={category} hasLocations={hasLocations} onClear={() => updateFilters(EMPTY_FILTERS)} />
          )}
        </section>
      </div>
    </div>
  )
}

export default CoworksPage
