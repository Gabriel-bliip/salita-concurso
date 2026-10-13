import CategoryCard from '../components/CategoryCard.tsx'
import { CATEGORIES } from '../data/categories.ts'

function SpacesPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <p className="text-sm font-semibold text-primary">Un lugar para cada idea</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-ink sm:text-4xl">Espacios</h1>
      <p className="mt-3 max-w-2xl text-ink-muted">Elige el espacio que necesitas y explora sus ubicaciones. Reserva por hora, sin planes ni suscripciones.</p>
      <section aria-label="Categorías de espacios" className="mt-10 grid grid-cols-1 gap-4 min-[400px]:grid-cols-2 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
        {CATEGORIES.map((category) => <CategoryCard key={category.id} category={category} />)}
      </section>
    </div>
  )
}

export default SpacesPage
