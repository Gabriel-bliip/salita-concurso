import { SearchX } from 'lucide-react'
import type { Category } from '../data/categories.ts'
import Button from './Button.tsx'

function ExplorationEmptyState({ category, hasLocations, onClear }: { category: Category; hasLocations: boolean; onClear: () => void }) {
  return (
    <div className="mt-4 flex min-h-72 flex-col items-center justify-center rounded-card border border-dashed border-line-strong px-6 py-16 text-center" role="status">
      <SearchX className="size-10 text-ink-muted" aria-hidden />
      <p className="mt-4 font-medium text-ink">{hasLocations ? 'No hay ubicaciones con esos filtros' : `Aún no hay ubicaciones de ${category.name}`}</p>
      <p className="mt-1 text-sm text-ink-muted">{hasLocations ? 'Prueba con otros filtros para encontrar tu espacio.' : 'Puedes explorar las demás categorías para encontrar un espacio.'}</p>
      {hasLocations
        ? <Button onClick={onClear} variant="secondary" className="mt-6">Limpiar filtros</Button>
        : <Button to="/espacios" variant="secondary" className="mt-6">Explorar categorías</Button>}
    </div>
  )
}

export default ExplorationEmptyState
