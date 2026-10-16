import { NavLink } from 'react-router'
import { MARKETPLACE_CATEGORIES } from '../data/marketplaceCategories.ts'

function CategoryNavigation({ map = false }: { map?: boolean }) {
  return (
    <nav aria-label="Categorías de espacios" className="flex flex-wrap gap-3">
      {MARKETPLACE_CATEGORIES.map((category) => (
        <NavLink
          key={category.id}
          to={`/espacios/${category.id}${map ? '/mapa' : ''}`}
          end
          className={({ isActive }) => `inline-flex items-center rounded-control border px-4 py-2.5 text-sm font-semibold transition-colors ${
            isActive
              ? 'border-primary bg-primary text-on-primary'
              : 'border-line-strong bg-surface text-primary hover:bg-primary-soft'
          }`}
        >
          {category.name}
        </NavLink>
      ))}
    </nav>
  )
}

export default CategoryNavigation
